import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateCandidateDto, UpdateCandidateDto } from './dto';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
import path from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';
import { Approval } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { sendMail } from 'src/config/mailer.config';
import * as nodemailer from 'nodemailer';

interface CsvCandidates {
  nama: string;
  nim: string;
  prodi: string;
  email: string;
  no_telp: string;
  agama: string;
  lk1: number;
  lk2: number;
  sc: number;
  rerata: number;
  approval: string;
  description: string;
}

@Injectable()
export class CandidateService {
  private transporter: nodemailer.Transporter;
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.transporter = sendMail(this.config);
  }
  async createCandidate(createCandidateDto: CreateCandidateDto, photo: Express.Multer.File): Promise<any> {
    try {
      const existingCandidate = await this.prisma.candidate.findFirst({
        where: {
          OR: [
            { email: createCandidateDto.email },
            { nim: createCandidateDto.nim }
          ],
        },
      });

      if (existingCandidate) {
        throw new ConflictException('Email or NIM is already in use');
      }

      let imageUrl: string | null = null;
      if (photo) {
        const baseUrl = '/uploads/';
        imageUrl = `${baseUrl}${photo.filename}`; 
      }
      

      const createdCandidate = await this.prisma.candidate.create({
        data: {
          ...createCandidateDto,
          image : imageUrl,
          approval: 'OnProgres',
        },
      });

      return {
        id: createdCandidate.id,
        email: createdCandidate.email,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllCandidates() {
    try {
      return await this.prisma.candidate.findMany({
        select: {
          id: true,
          nama: true,
          nim: true,
          prodi: true,
          angkatan: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch candidate: ${error.message}`);
    }
  }

  async getCandidatesById(id: string): Promise<any> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id: id },
      });

      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      return candidate;
    } catch (error) {
      throw error;
    }
  }

  async updateCandidate(id: string, updateCandidate:UpdateCandidateDto): Promise<any> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const { lk1, lk2, sc, keaktifan, ...otherFields } = updateCandidate;
    const scores = [lk1, lk2, sc, keaktifan].filter(score => score !== undefined && score !== null);
    const rerata = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : candidate.rerata; 
   
    
    const dataToUpdate: any = {
      ...otherFields,
      lk1,
      lk2,
      sc,
      keaktifan,
      rerata,

    };
    
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id },
      data: dataToUpdate,
    });

    return updatedCandidate;
  }

  async updateImage(id: string, photo: Express.Multer.File): Promise<any> {
    const candidate = await this.prisma.candidate.findUnique({
      where: { id },
    });

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const baseUrl = '/uploads/';
    const imageUrl = photo ? `${baseUrl}${photo.filename}` : candidate.image;

    const updatedCandidate = await this.prisma.candidate.update({
      where: { id },
      data: {
        image: imageUrl,
      },
    });

    return {
      id: updatedCandidate.id,
      image: updatedCandidate.image,
    };
  }

  async deleteCandidate(id: string): Promise<boolean> {
    try {
      const candidate = await this.prisma.candidate.findUnique({
        where: { id : id },
      });
  
      if (!candidate) {
        throw new NotFoundException('Participant not found');
      }
  
      await this.prisma.candidate.delete({
        where: { id: id },
      });
  
      return true;
    } catch (error) {
      throw error;
    }
  }

  async exportCandidatesToCsv(): Promise<string> {
    try {
      const candidates = await this.prisma.candidate.findMany();
  
      const csvCandidates: CsvCandidates[] = candidates.map(candidate => ({
        nama: candidate.nama,
        nim: candidate.nim,
        prodi: candidate.prodi,
        email: candidate.email,
        no_telp: candidate.no_telp,
        agama: candidate.agama || 'N/A', 
        angkatan: candidate.angkatan || 'N/A',
        lk1: candidate.lk1 || 0,         
        lk2: candidate.lk2 || 0,       
        sc: candidate.sc || 0,           
        rerata: candidate.rerata || 0,   
        approval: candidate.approval,  
        description: candidate.description || 'N/A',
      }));
  

      const exportDir = path.join(__dirname, '..', 'exports');
      const filePath = path.join(exportDir, 'candidates.csv');

      if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      }
    
      const csvWriter = createCsvWriter({
      path: filePath,
        header: [
          { id: 'nama', title: 'Nama' },
          { id: 'nim', title: 'NIM' },
          { id: 'prodi', title: 'Prodi' },
          { id: 'email', title: 'Email' },
          { id: 'no_telp', title: 'No Telepon' },
          { id: 'agama', title: 'Agama' },
          { id: 'angkatan', title: 'Angkatan' },
          { id: 'lk1', title: 'LK1' },
          { id: 'lk2', title: 'LK2' },
          { id: 'sc', title: 'SC' },
          { id: 'rerata', title: 'Rerata' },
          { id: 'approval', title: 'Approval' },
          { id: 'description', title: 'Description' },
        ],
      });
  
      await csvWriter.writeRecords(csvCandidates);
  
      return 'CSV export successful!';
    } catch (error) {
      console.error('Error exporting candidates to CSV:', error);
      throw new Error('Failed to export CSV');
    }
  }

  async decisionCandidate(id: string, status: 'Accepted' | 'Rejected'): Promise<any> {
    try {
      if (!['Accepted', 'Rejected'].includes(status)) {
        throw new BadRequestException('Invalid status. Only "Accepted" or "Rejected" are allowed.');
      }

      const candidate = await this.prisma.candidate.findUnique({
        where: { id },
      });
  
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }
  
      const updatedCandidate = await this.prisma.candidate.update({
        where: { id },
        data: {
          approval: status as Approval,
        },
      });
  
      if (status === 'Accepted') {

        const existingUser = await this.prisma.users.findFirst({
          where: { email: candidate.email },
        });
  
        if (existingUser) {
          throw new ConflictException('User already exists.');
        }
        
        const newNra = await this.generateNRA();
        const password = this.generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
  
        const createdUser = await this.prisma.users.create({
          data: {
            nra: newNra,
            email: candidate.email,
            nama: candidate.nama,
            password: hashedPassword,
            no_telp: candidate.no_telp,
            jenis_kelamin: candidate.jenis_kelamin,
            agama: candidate.agama,
            nim: candidate.nim,
            fakultas: candidate.fakultas,
            prodi: candidate.prodi,
            image: candidate.image,
            angkatan: candidate.angkatan,
            status: 'Active',
          },
        })

        await this.sendAcceptedEmail(createdUser.id, password);

        return {
          message: 'Candidate Accepted successfully',
          password: `Generated password: ${password}`, 
        };
      }
  
      if (status === 'Rejected') {
        await this.sendRejectedEmail(candidate.id);
        return {
          message: 'Candidate Rejected successfully',
        };
      }

    } catch (error) {
      console.error('Error during decisionCandidate process:', error.message);
      throw new Error(`Failed to process candidate approval: ${error.message}`);
    }
  }
  
  private  generateRandomPassword(): string {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      password += characters[randomIndex];
    }
    return password;
  }

  async generateNRA(): Promise<string> {

    const nraData = await this.prisma.users.findMany({ select: { nra: true } });

    const maxNRA = nraData.reduce((max, current) => {
      if (current.nra) {
        const nraParts = current.nra.split('/');
        if (nraParts.length > 0) {
          const currentNRA = parseInt(nraParts[0]);
          if (!isNaN(currentNRA) && currentNRA > max) {
            max = currentNRA;
          }
        }
      }
      return max;
    }, 0);

    const nraLatest = maxNRA + 1;
    const now = new Date();

    const currentYear = now.getFullYear().toString();

    const nranow = `${nraLatest}/UKM_IK/XXIX/${currentYear}`;

    return nranow;
  }

  async sendAcceptedEmail(userId: string, password:string): Promise<void> {
    try {
        const user = await this.prisma.users.findUnique({
          where: { id: userId },
          select: {
              email: true,
              nra: true,
              nama: true,
            }
        });

        if (!user) {
          throw new Error('User not found');
        }
        const mailOptions = {
          from: 'ukmik@utdi.ac.id',
          to: user.email,
          subject: 'Congratulations! Your Application Has Been Approved',
          text: `Dear ${user.nama},\n\n` +
          `Congratulations! We are thrilled to inform you that your application to join UKM IK has been successful.\n\n` +
          `Below are your account details:\n` +
          `NRA: ${user.nra}\n` +
          `Name: ${user.nama}\n` +
          `Email: ${user.email}\n` +
          `Password: ${password}\n\n` +
          `Please use your email and the password provided to log in and access your account. We recommend changing your password after your first login for security purposes.\n\n` +
          `We are excited to have you on board and look forward to your contributions to the community.\n\n` +
          `Best regards,\nUKM IK Student Committee` 
        } 
        await this.transporter.sendMail(mailOptions);
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendRejectedEmail(userId: string): Promise<void> {
    const user = await this.prisma.candidate.findUnique({
      where: { id: userId },
      select: {
        nama: true,
        email: true,
        }
      });
      if (!user) {
        throw new Error('User not found');
      }
      const mailOptions = {
        from: 'ukmik@utdi.ac.id',
        to: user.email,
        subject: 'Important Update: Your Application Has Been Rejected ',
        text: `Dear ${user.nama},\n\n` +
      `Thank you for your interest in joining UKM IK. We appreciate the time and effort you invested in your application. ` +
      `After careful consideration, we regret to inform you that your application has not been successful at this time.\n\n` +
      `We encourage you to stay connected and keep an eye on future opportunities with UKM IK. We wish you all the best in your future endeavors.\n\n` +
      `Warm regards,\nUKM IK Student Committee`

    };

    await this.transporter.sendMail(mailOptions);
  }
}