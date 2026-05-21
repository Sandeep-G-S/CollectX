package com.collectx.legal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@SpringBootApplication
@EnableFeignClients
public class LegalApplication {

	public static void main(String[] args) {
		SpringApplication.run(LegalApplication.class, args);
	}

}
