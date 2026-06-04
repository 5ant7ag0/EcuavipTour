package com.ecuaviptour.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import java.io.File;
import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String userDir = System.getProperty("user.dir");
        
        // Path to new local Spring Boot uploads folder
        String localUploadsPath = Paths.get(userDir, "uploads").toAbsolutePath().toString();
        
        // Path to legacy Flask uploads folder (fallback/backward compatibility)
        String legacyUploadsPath = Paths.get(userDir, "..", "backend", "uploads").toAbsolutePath().toString();
        
        // Register resource handler to look in local uploads first, then fall back to legacy uploads
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + localUploadsPath + "/", "file:" + legacyUploadsPath + "/");
    }

}
