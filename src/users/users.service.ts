import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'nestjs-prisma';
import { CreateUserseDto, UpdateUserseDto } from './dto';
import * as bcrypt from 'bcrypt';
import path from 'path';
import * as fs from 'fs';
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
interface CsvUsers {
  nra: string;
  nama: string;
  nim: string;
  prodi: string;
  email: string;
  no_telp: string;
  agama: string;
}


@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async createUsers(createUserseDto: CreateUserseDto, photo: Express.Multer.File): Promise<any> {
    try {
      const existingUsers = await this.prisma.users.findFirst({
        where: {
          OR: [
            { email: createUserseDto.email },
            { nim: createUserseDto.nim },
          ],
        },
      });

      if (existingUsers) {
        throw new ConflictException('Email or NIM is already in use');
      }

      let imageUrl: string | null = null;
      if (photo) {
        const baseUrl = '/uploads/';
        imageUrl = `${baseUrl}${photo.filename}`; 
      }
      
      const hashedPassword = await bcrypt.hash(createUserseDto.password, 10);
      const createUsers = await this.prisma.users.create({
        data: {
          ...createUserseDto,
          image : imageUrl,
          password : hashedPassword,
        },
      });

      return {
        id: createUsers.id,
        email: createUsers.email,
      };
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await this.prisma.users.findMany({
        select: {
          id: true,
          nama: true,
          nra: true,
          nim: true,
          prodi: true,
        },
      });
    } catch (error) {
      throw new Error(`Failed to fetch candidate: ${error.message}`);
    }
  }

  async getUsersById(id: string): Promise<any> {
    try {
      const users = await this.prisma.users.findUnique({
        where: { id: id },
      });

      if (!users) {
        throw new NotFoundException('users not found');
      }

      return users;
    } catch (error) {
      throw error;
    }
  }

  async updateUsers(id: string, updateUsersDto: UpdateUserseDto): Promise<any> {
    const user = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { ...dataToUpdate } = updateUsersDto;

    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const updatedUser = await this.prisma.users.update({
      where: { id },
      data: dataToUpdate,
    });

    return updatedUser;
  }

  async updateImage(id: string, photo: Express.Multer.File): Promise<any> {
    const users = await this.prisma.users.findUnique({
      where: { id },
    });

    if (!users) {
      throw new NotFoundException('Candidate not found');
    }

    const baseUrl = '/uploads/';
    const imageUrl = photo ? `${baseUrl}${photo.filename}` : users.image;

    const updateUsers = await this.prisma.users.update({
      where: { id },
      data: {
        image: imageUrl,
      },
    });

    return {
      id: updateUsers.id,
      image: updateUsers.image,
    };
  }

  async deleteUsers(id: string): Promise<boolean> {
    try {
      const users = await this.prisma.users.findUnique({
        where: { id : id },
      });
  
      if (!users) {
        throw new NotFoundException('users not found');
      }
  
      await this.prisma.users.delete({
        where: { id: id },
      });
  
      return true;
    } catch (error) {
      throw error;
    }
  }

  async exportUsersToCsv(): Promise<string> {
    try {
      const users = await this.prisma.users.findMany();
  
      const csvUsers: CsvUsers[] = users.map(users => ({
        nra : users.nra,
        nama: users.nama,
        nim: users.nim,
        prodi: users.prodi,
        fakultas : users.fakultas,
        email: users.email,
        no_telp: users.no_telp,
        agama: users.agama || 'N/A', 
        angkatan: users.angkatan || 'N/A',
        status: users.status,  
      }));
  

      const exportDir = path.join(__dirname, '..', 'exports');
      const filePath = path.join(exportDir, 'users.csv');

      if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
      }
    
      const csvWriter = createCsvWriter({
      path: filePath,
        header: [
          { id: 'nra', title: 'NRA' },
          { id: 'nama', title: 'Nama' },
          { id: 'nim', title: 'NIM' },
          { id: 'prodi', title: 'Prodi' },
          { id: 'email', title: 'Email' },
          { id: 'no_telp', title: 'No Telepon' },
          { id: 'agama', title: 'Agama' },
          { id: 'angkatan', title: 'Angkatan' },
          { id: 'status', title: 'Status' },
        ],
      });
  
      await csvWriter.writeRecords(csvUsers);
  
      return 'CSV export successful!';
    } catch (error) {
      console.error('Error exporting candidates to CSV:', error);
      throw new Error('Failed to export CSV');
    }
  }
}