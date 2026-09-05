package com.shopjoy.ecBeBo.co.auth.service;

import com.shopjoy.ecBeBo.base.sy.data.entity.SyUser;
import com.shopjoy.ecBeBo.base.sy.repository.SyUserRepository;
import lombok.RequiredArgsConstructor;
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
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final SyUserRepository syUserRepository;

    /** loadUserByUsername — 로드 */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String userIdOrLoginId) throws UsernameNotFoundException {
        // JWT sub claim(userId)로 먼저 시도, 없으면 로그인 화면 입력값(loginId)으로 폴백
        // [쿼리 메서드] 관리자 사용자 단건 조회
        SyUser syUser = syUserRepository.findById(userIdOrLoginId)
            // [쿼리 메서드] 관리자 사용자 조건별 조회
            .or(() -> syUserRepository.findByLoginId(userIdOrLoginId))
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + userIdOrLoginId));

        if (!"ACTIVE".equals(syUser.getUserStatusCd())) {
            throw new UsernameNotFoundException("User is not active: " + userIdOrLoginId);
        }

        List<SimpleGrantedAuthority> authorities = List.of(
            new SimpleGrantedAuthority("BO_GUEST")
        );

        return new User(syUser.getUserId(), syUser.getLoginPwdHash(), authorities);
    }
}
