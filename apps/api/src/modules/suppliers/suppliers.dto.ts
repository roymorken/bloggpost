import { IsString, IsOptional, IsArray, IsEmail } from 'class-validator';

export class CreateSupplierDto {
  @IsString()
  supplierName: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateSupplierDto {
  @IsOptional()
  @IsString()
  supplierName?: string;

  @IsOptional()
  @IsString()
  supplierCode?: string;

  @IsOptional()
  @IsEmail()
  primaryEmail?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  ccEmails?: string[];

  @IsOptional()
  @IsString()
  notes?: string;
}
