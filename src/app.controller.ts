import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiProperty } from '@nestjs/swagger';
import { CreateAccountRequest, CreateAccountReesponse as CreateAccountResponse, CreateEventResponse, CreateEventRequest, BuyTicketRequest, BuyTicketResponse } from './dtos.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('account')
  async createAccount(@Body() account: CreateAccountRequest): Promise<CreateAccountResponse> {
    console.log(account)
    return { success: true };
  }

  @Post('event')
  async createEvent(@Body() event: CreateEventRequest): Promise<CreateEventResponse> {
    return {success: true}
  }

  @Post('ticket') 
  async buyTicket(@Body() ticket: BuyTicketRequest): Promise<BuyTicketResponse> {
    return {success: true}
  }
    
}