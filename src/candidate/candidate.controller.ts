import { Controller, Post, Body, UseInterceptors, UploadedFile, HttpStatus, Res, Put, Param, Patch, Get, Delete } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CandidateService } from './candidate.service';
import { multerConfig } from 'src/config/multer.config';
import { ApiTags } from '@nestjs/swagger';
import { ErrorHandler } from 'src/exception/error-handler'; 
import { Response } from 'express';
import { UpdateCandidateDto,CreateCandidateDto } from './dto';
import path from 'path';
import * as fs from 'fs';
import { Public } from 'src/common/decorators';

@ApiTags('Candidates')
@Controller({
  path: 'candidates',
  version: '1',
})
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Public()
  @Post('/create-candidates')
  @UseInterceptors(FileInterceptor('photo', multerConfig)) 
  async createCandidate(
    @Body() createCandidateDto: CreateCandidateDto,
    @UploadedFile() photo: Express.Multer.File,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const createCandidate = await this.candidateService.createCandidate(createCandidateDto, photo);
      return res.status(HttpStatus.CREATED).json( {
        status_code: HttpStatus.CREATED,
        message: 'Candidate Created Successfully',
        data: createCandidate,
      });
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Get('/lists-candidates')
  async getAllCandidates(@Res() res: Response): Promise<Response> {
    try {
      const candidates = await this.candidateService.getAllCandidates();
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Successfully',
        data: candidates,
      });
    } catch (error) {
      ErrorHandler.handleError(error);
    }
  }

  @Get('/detail-candidates/:id')
  async getCandidatesById(
    @Param('id') id: string,
    @Res() res: Response): Promise<Response> {
    try {
      const candidates = await this.candidateService.getCandidatesById(id);
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Successfully',
        data: candidates,
      });
    } catch (error) {
      ErrorHandler.handleError(error);
    }
  }

  @Patch('/update-candidates/:id')
  async updateCandidate(
    @Param('id') id: string,
    @Body() updateCandidateDto: UpdateCandidateDto,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const updateCandidate = await this.candidateService.updateCandidate(
        id,
        updateCandidateDto,
      );
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: 'Candidate updated successfully',
        data: updateCandidate,
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
      const updatedCandidate = await this.candidateService.updateImage(id, photo); 
      return res.status(HttpStatus.CREATED).json( {
        status_code: HttpStatus.CREATED,
        message: 'Image Update Successfully',
        data: {
          id: updatedCandidate.id,
          image: updatedCandidate.image,
        },
      });
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }

  @Delete('/delete-candidates/:id')
  async deleteCandidates(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<Response> {
    try {
      const deleteCandidate = await this.candidateService.deleteCandidate(id);
      if (deleteCandidate) {
        return res.status(HttpStatus.OK).json({
          status_code: HttpStatus.OK,
          message: 'Candidates deleted successfully',
        });
      }
    } catch (error) {
      ErrorHandler.handleError(error); 
    }
  }
 
  @Get('/export-candidates')
    async exportCandidates(@Res() res: Response): Promise<any> {
      try {
        const message = await this.candidateService.exportCandidatesToCsv();
  
       
        const filePath = path.join(__dirname, '..', 'exports', 'candidates.csv');
  
     
        if (fs.existsSync(filePath)) {
        
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=candidates.csv');
  
         
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

  @Patch('/decision/:id')
  async decisionCandidate(
    @Param('id') id: string,
    @Body('status') status: 'Accepted' | 'Rejected',
    @Res() res: Response,
  ): Promise<Response>{
    try {
      const result = await this.candidateService.decisionCandidate(id, status);
      return res.status(HttpStatus.OK).json({
        status_code: HttpStatus.OK,
        message: result.message,
      });

    } catch (error) {
       ErrorHandler.handleError(error); 
    }
  }
}
