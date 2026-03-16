import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuid } from 'uuid';

export interface ProxyConfig {
  server: string;
  username?: string;
  password?: string;
  sessionId: string;
}

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly proxyUrl: string;
  private readonly proxyUser: string;
  private readonly proxyPassword: string;

  constructor(private readonly config: ConfigService) {
    this.proxyUrl = config.get('PROXY_URL', '');
    this.proxyUser = config.get('PROXY_USER', '');
    this.proxyPassword = config.get('PROXY_PASSWORD', '');
  }

  isConfigured(): boolean {
    return this.proxyUrl.length > 0;
  }

  getRotatingSession(): ProxyConfig {
    const sessionId = uuid().slice(0, 8);
    this.logger.debug(`New proxy session: ${sessionId}`);

    return {
      server: this.proxyUrl,
      username: this.proxyUser ? `${this.proxyUser}-session-${sessionId}` : undefined,
      password: this.proxyPassword || undefined,
      sessionId,
    };
  }
}
