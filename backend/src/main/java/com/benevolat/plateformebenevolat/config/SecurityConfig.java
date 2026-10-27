package com.benevolat.plateformebenevolat.config;

import com.benevolat.plateformebenevolat.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.http.HttpMethod;

import java.util.List;

/**
 * Configuration Spring Security avec JWT (stateless), BCrypt et CORS explicite.
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Explorer / inscriptions : bénévoles uniquement (avant le permitAll /api/missions/**)
                .requestMatchers(HttpMethod.GET,
                        "/api/missions/explorer",
                        "/api/missions/recommandations",
                        "/api/missions/carte"
                ).hasRole("BENEVOLE")
                .requestMatchers(HttpMethod.POST,
                        "/api/missions/{id}/inscription",
                        "/api/missions/{id}/inscription/confirmer-renfort"
                ).hasRole("BENEVOLE")
                .requestMatchers(HttpMethod.DELETE, "/api/missions/{id}/inscription").hasRole("BENEVOLE")
                .requestMatchers("/api/benevole/**").hasRole("BENEVOLE")
                // Endpoints publics (authentification, statistiques, missions, associations, catalogue)
                .requestMatchers(
                    "/api/health",
                    "/api/auth/**",
                    "/api/competences/**",
                    "/api/domaines/**",
                    "/api/stats/**",
                    "/api/missions/**",
                    "/api/certificates/**"
                ).permitAll()
                // GET /api/associations (liste publique) — accessible sans authentification
                .requestMatchers(HttpMethod.GET, "/api/associations").permitAll()
                // /api/associations/me/** — réservé aux associations authentifiées
                .requestMatchers("/api/associations/me/**").hasRole("ASSOCIATION")
                // Autres endpoints associations restent publics (pages de détail, etc.)
                .requestMatchers("/api/associations/**").permitAll()
                .requestMatchers("/api/benevoles/**").hasRole("BENEVOLE")
                // Toutes les autres requêtes API nécessitent un JWT valide
                .requestMatchers("/api/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
