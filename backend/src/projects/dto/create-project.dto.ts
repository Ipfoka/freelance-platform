import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  IsNotEmpty,
  IsInt,
  IsBoolean,
  IsIn,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  @Min(0)
  budget: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @IsNumber()
  @IsOptional()
  @IsInt()
  @Min(1)
  maxProposals?: number;

  @IsOptional()
  @IsString()
  @IsIn([
    'telegram_bot',
    'telegram_mini_app',
    'automation_pipeline',
    'ai_assistant',
    'integration',
  ])
  automationType?:
    | 'telegram_bot'
    | 'telegram_mini_app'
    | 'automation_pipeline'
    | 'ai_assistant'
    | 'integration';

  @IsOptional()
  @IsString()
  botStage?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  integrations?: string[];

  @IsOptional()
  @IsString()
  mainGoal?: string;

  @IsOptional()
  @IsNumber()
  @IsInt()
  @Min(1)
  deadlineDays?: number;

  @IsOptional()
  @IsBoolean()
  supportNeeded?: boolean;
}
