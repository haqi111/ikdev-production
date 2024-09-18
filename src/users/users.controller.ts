import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerConfig } from 'src/config/multer.config';
import { ErrorHandler } from 'src/exception/error-handler';
import { CreateUserseDto, UpdateUserseDto } from './dto';
import { Response } from 'express';
import path from 'path';
import * as fs from 'fs';
import { Public } from 'src/common/decorators';


@ApiTags('Users')
@Controller({
  path: 'users',
  version: '1',
})
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  
  @Post('/create-users')
  @UseInterceptors(FileInterceptor('photo', multerConfig)) 
  async createUsers(
    @Body() createUsersDto: CreateUserseDto,
    @UploadedFile() photo: Express.Multer.File,
    @Res() res: Response,
  ): Promise<Response> {
    try {      
      const createUsers = await this.usersService.createUsers(createUsersDto, photo);
      return res.status(HttpStatus.CREATED).json( {
        status_code: HttpStatus.CREATED,
        message: 'Candidate Created Successfully',
        data: createUsers,
      });
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Get('/lists-users')
  async getAllUsers(@Res() res: Response): Promise<Response> {
    try {
      const users = await this.usersService.getAllUsers();
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Successfully',
        data: users,
      });
    } catch (error) {
      ErrorHandler.handleError(error);
    }
  }

  @Get('/detail-users/:id')
  async getUsersById(
    @Param('id') id: string,
    @Res() res: Response): Promise<Response> {
    try {
      const users = await this.usersService.getUsersById(id);
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Successfully',
        data: users,
      });
    } catch (error) {
      ErrorHandler.handleError(error);
    }
  }

  @Patch('/update-users/:id')
  async updateUsers(
    @Param('id') id: string,
    @Body() updateUserseDto: UpdateUserseDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const updateUsers = await this.usersService.updateUsers(
        id,
        updateUserseDto,
      );
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Candidate updated successfully',
        data: updateUsers,
      });
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Patch('/update-image/:id')
  @UseInterceptors(FileInterceptor('photo', multerConfig)) 
  async updateImage(
    @Param('id') id: string,
    @UploadedFile() photo: Express.Multer.File,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const updateUsersImage = await this.usersService.updateImage(id, photo); 
      return res.status(HttpStatus.CREATED).json( {
        status_code: HttpStatus.CREATED,
        message: 'Image Update Successfully',
        data: {
          id: updateUsersImage.id,
          image: updateUsersImage.image,
        },
      });
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Delete('/delete-users/:id')
  async deleteCandidates(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const deleteUsers = await this.usersService.deleteUsers(id);
      if (deleteUsers) {
        return res.status(HttpStatus.OK).json({
          status_code: HttpStatus.OK,
          message: 'Users deleted successfully',
        });
      }
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Get('/export-users')
  async exportCandidates(@Res() res: Response): Promise<any> {
    try {
      const message = await this.usersService.exportUsersToCsv();

     
      const filePath = path.join(__dirname, '..', 'exports', 'users.csv');

   
      if (fs.existsSync(filePath)) {
      
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users.csv');

       
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
      } else {
        
        return res.status(HttpStatus.NOT_FOUND).json({
          message: 'CSV file not found',
        });
      }
    } catch (error) {
      ErrorHandler.handleError(error); 
  }
}
}
