import { BadRequestException, ForbiddenException, Injectable, NotFoundException, Req, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'nestjs-prisma';
import { AuthDto, ForgotPassword } from './dto';
import { JwtPayload, Tokens } from './types';
import * as bcrypt from 'bcrypt';
import { IncomingHttpHeaders } from 'http';
import * as nodemailer from 'nodemailer';
import { randomUUID } from 'crypto';
import { sendMail } from 'src/config/mailer.config';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;  
  constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private config: ConfigService,
    ) {
      this.transporter = sendMail(this.config);
    }

    async login(dto: AuthDto): Promise<Tokens> {
        const users = await this.prisma.users.findFirst({
          where: { email: dto.email },
        });
    
        if (!users) {
          throw new ForbiddenException('Access Denied');
        }
    
        const passwordMatches = await bcrypt.compare(dto.password, users.password);
        if (!passwordMatches) {
          throw new ForbiddenException('Access Denied');
        }
    
        const tokens = await this.getTokens(users.id);
        await this.updateRtHash(users.id, tokens.refresh_token);
        return tokens;
    }
    async logout(id: string): Promise<boolean> {
        await this.prisma.users.updateMany({
          where: {
            id: id,
            hashRt: {
              not: null,
            },
          },
          data: {
            hashRt: null,
          },
        });
        return true;
    }
    async getTokens(id: string): Promise<Tokens> {
        const users = await this.prisma.users.findUnique({
          where: {
            id: id,
          },
        });
    
        if (!users) {
          throw new NotFoundException('User not found');
        }
        const jwtPayload: JwtPayload = {
          id: users.id,
          email: users.email,
          name: users.nama,
        };
    
        const [at, rt] = await Promise.all([
          this.jwtService.signAsync(jwtPayload, {
            secret: this.config.get<string>('AT_SECRET'),
            expiresIn: '1d',
          }),
          this.jwtService.signAsync(jwtPayload, {
            secret: this.config.get<string>('RT_SECRET'),
            expiresIn: '7d',
          }),
        ]);
    
        return {
          access_token: at,
          refresh_token: rt,
        };
    }
    async updateRtHash(id: string, rt: string): Promise<void> {
      try {
        const hash = await bcrypt.hash(rt, 10);
        await this.prisma.users.update({
          where: {
            id: id,
          },
          data: {
            hashRt: hash,
          },
        });
      } catch (error) {
        throw new Error(`Failed to update RT hash: ${error.message}`);
      }
    }
    async refreshTokens(id: string, rt: string): Promise<Tokens> {
      const users = await this.prisma.users.findUnique({
        where: {
          id: id,
        },
      });
      if (!users || !users.hashRt) throw new ForbiddenException('Access Denied');
  
      const rtMatches = await bcrypt.compare(rt, users.hashRt);
      if (!rtMatches) throw new ForbiddenException('Access Ditolak');
  
      const tokens = await this.getTokens(users.id);
      await this.updateRtHash(users.id, tokens.refresh_token);
  
      return tokens;
    }
    async changePassword( @Req() req: Request, oldPassword: string, newPassword: string,) {
      const headers = req.headers as unknown as IncomingHttpHeaders;
      if (!headers || !headers.authorization) {
        throw new Error('Authorization header is missing');
      }
      const token = headers.authorization.split(' ')[1];
      const id = await this.extractUserIdFromToken(token);
  
      await this.verifyPassword(oldPassword, id);
  
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      const result = await this.prisma.users.update({
        where: { id: id },
        data: { password: hashedNewPassword },
      });
      return result;
    }
    async verifyPassword( oldPassword: string, id: string) {
      const admin = await this.prisma.users.findUnique({
        where: { id: id },
      });
      if (!admin) {
        throw new NotFoundException('User not found');
      }
      const isPasswordValid = await bcrypt.compare(oldPassword, admin.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid old password');
      }
    }
    async extractUserIdFromToken(token: string): Promise<string> {
    const decoded: any = this.jwtService.decode(token);
    if (!decoded || !decoded.id) {
      throw new Error('Invalid JWT token or missing user ID');
    }
    return decoded.id;
    }
    async forgotPassword(dto: ForgotPassword): Promise<{ message: string }> {
      const user = await this.prisma.users.findFirst({
        where: {
          email : dto.email
        },
      });
  
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const existingToken = await this.prisma.passwordReset.findUnique({
        where: {
            user_id: user.id,
        },
      });
  
      if (existingToken) {
        if (existingToken.validUntil < new Date()) {
            await this.prisma.passwordReset.delete({
                where: {
                    token: existingToken.token,
                },
            });
        } else {
          return { message: 'Wait 5 minutes to resend the email' };
        }
      }
  
      const token = await this.getResetToken();
  
      const currentDate = new Date();
      const expirationDate = new Date(currentDate.getTime() + 5 * 60 * 1000);
  
      await this.prisma.passwordReset.create({
        data: {
          token,
          user_id: user.id,
          validUntil: expirationDate,
        },
      });
  
     await this.sendForgotPasswordEmail(user.email, token);
  
      return { message: 'Email with password reset link has been sent.' };
    }
    async getResetToken(): Promise<string> {
      const uuidTokenWithHyphens = randomUUID();
  
      const uuidToken = uuidTokenWithHyphens.replace(/-/g, '');
  
      const token = uuidToken.slice(0, 21);
    
      return token;
    }
    async resetPassword(token: string, newPassword: string, confirmPassword: string, ): Promise<void> {
      const passwordReset = await this.prisma.passwordReset.findFirst({
        where: {
          token,
          validUntil: {
            gte: new Date(),
          },
        },
        include: {
          user: true,
        },
      });
    
      if (!passwordReset) {
        throw new NotFoundException('Invalid reset token');
      }
      if (newPassword !== confirmPassword) {
        throw new BadRequestException('New password and confirm password do not match');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.prisma.users.update({
        where: {
          id: passwordReset.user.id,
        },
        data: {
          password: hashedPassword,
        },
      });
      await this.prisma.passwordReset.delete({
        where: {
          token,
        },
      });
    }
    async sendForgotPasswordEmail(email: string, token: string): Promise<void> {
      const mailOptions = {
        from: 'email@example.com', 
        to: email,
        subject: 'Reset Your Password', 
        text: `To reset your password, click on the following link: http://yourdomain.com/reset-password/${token}`
      };
  
      // Send the email
      await this.transporter.sendMail(mailOptions);
    }
}
