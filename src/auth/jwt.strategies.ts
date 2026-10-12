import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // runs only after the signature and expiry are verified; the return value becomes req.user
  // looks like JWT_token decoded.
  validate(payload: { sub: number; email: string }) {
    return { userId: payload.sub, email: payload.email };
  }

  // Whatever object your validate() method returns is automatically assigned by Passport to request.user (we access it in controller)
}


// NestJS JWT & req.user Notes

// These two concepts are two sides of the same coin. Here is the exact sequence of how a request flows through the JwtStrategy.

// The 4-Step Journey:

// 1. Extraction
//    - Request hits a protected endpoint (@UseGuards(JwtAuthGuard)).
//    - JwtStrategy runs first.
//    - ExtractJwt.fromAuthHeaderAsBearerToken() reads the Authorization: Bearer <TOKEN> header.

// 2. Verification
//    - Passport uses your secretOrKey to verify the token signature.
//    - Checks that the token has not expired.
//    - Note: Standard JWTs are signed and encoded (not encrypted). Anyone can decode them, but a valid signature 
//      prevents tampering.

// 3. The validate() Function
//    - If the token is valid and active, Passport decodes the JSON payload.
//    - It passes this payload into your validate(payload) method.

// 4. Attaching to req.user (check controller)
//    - Whatever your validate() function returns is automatically attached by NestJS/Passport to the Express request object
//      as req.user.

// Summary:
// - req.user comes directly from whatever object you return inside your JwtStrategy's validate() method.
// - Example: If validate() returns { userId: payload.sub, email: payload.email }, those properties will be available on req.user
//   inside your controller.