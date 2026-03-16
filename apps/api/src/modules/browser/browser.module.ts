import { Module, Global } from '@nestjs/common';
import { BrowserService } from './browser.service';
import { ProxyService } from './proxy.service';

@Global()
@Module({
  providers: [BrowserService, ProxyService],
  exports: [BrowserService, ProxyService],
})
export class BrowserModule {}
