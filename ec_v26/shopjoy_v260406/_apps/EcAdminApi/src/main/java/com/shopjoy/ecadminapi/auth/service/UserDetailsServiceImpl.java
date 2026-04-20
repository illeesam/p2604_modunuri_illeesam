package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userIdOrLoginId) throws UsernameNotFoundException {
        SyUser syUser = null;

        // Try by userId first (used for JWT sub claim)
        try {
            syUser = em.createQuery(
                "SELECT u FROM SyUser u WHERE u.userId = :val", SyUser.class)
                .setParameter("val", userIdOrLoginId)
                .getSingleResult();
        } catch (NoResultException e) {
            // fallback: by loginId (used for login)
            try {
                syUser = em.createQuery(
                    "SELECT u FROM SyUser u WHERE u.loginId = :val", SyUser.class)
                    .setParameter("val", userIdOrLoginId)
                    .getSingleResult();
            } catch (NoResultException ex) {
                throw new UsernameNotFoundException("User not found: " + userIdOrLoginId);
            }
        }

        if (!"ACTIVE".equals(syUser.getUserStatusCd())) {
            throw new UsernameNotFoundException("User is not active: " + userIdOrLoginId);
        }

        List<SimpleGrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("ROLE_ADMIN")
        );

        return new User(syUser.getUserId(), syUser.getUserPassword(), authorities);
    }
}
