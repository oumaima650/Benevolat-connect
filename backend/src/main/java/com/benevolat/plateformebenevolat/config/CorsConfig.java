package com.benevolat.plateformebenevolat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration CORS (Cross-Origin Resource Sharing).
 * Sans cette config, le navigateur bloquerait les appels du frontend
 * vers le backend car ils sont sur des ports différents (5500 vs 8080).
 *
 * On autorise les origines des serveurs de développement courants :
 *  - http://localhost:5500   : Live Server (VS Code)
 *  - http://127.0.0.1:5500  : variante de Live Server
 *  - http://localhost:63342  : serveur intégré IntelliJ IDEA
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:63342"
                )
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
