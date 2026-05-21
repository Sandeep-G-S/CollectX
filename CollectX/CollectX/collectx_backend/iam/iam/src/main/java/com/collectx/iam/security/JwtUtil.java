package com.collectx.iam.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    // IMPORTANT: JJWT 0.12.x requires a key of at least 256 bits (32 characters).
    // "secretkey" is too short and will throw a WeakKeyException.
    private final String SECRET_STRING = "your-very-secure-and-long-secret-key-32-chars-min";

    // Create a SecretKey object from your string
    private final SecretKey SECRET_KEY = Keys.hmacShaKeyFor(SECRET_STRING.getBytes(StandardCharsets.UTF_8));

    public String generateToken(String username, String role) {
        return Jwts.builder()
                .subject(username)                 // setSubject -> subject
                .claim("role", role)
                .issuedAt(new Date())               // setIssuedAt -> issuedAt
                .expiration(new Date(System.currentTimeMillis() + 1000 * 60 * 60 * 10)) // setExpiration -> expiration
                .signWith(SECRET_KEY)               // signWith(Key) is preferred
                .compact();
    }

    public String extractUsername(String token) {
        return getClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(SECRET_KEY)             // setSigningKey -> verifyWith
                .build()                            // New required build() step
                .parseSignedClaims(token)           // parseClaimsJws -> parseSignedClaims
                .getPayload();                      // getBody -> getPayload
    }
}