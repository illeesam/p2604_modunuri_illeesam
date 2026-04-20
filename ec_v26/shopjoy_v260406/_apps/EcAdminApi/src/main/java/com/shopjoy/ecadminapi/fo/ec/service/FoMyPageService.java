package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberAddrMapper;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdClaimMapper;
import com.shopjoy.ecadminapi.base.ec.od.mapper.OdOrderMapper;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCacheMapper;
import com.shopjoy.ecadminapi.base.ec.pm.mapper.PmCouponMapper;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FO 마이페이지 서비스 — 현재 로그인 회원 전용
 * URL: /api/fo/ec/my
 */
@Service
@RequiredArgsConstructor
public class FoMyPageService {

    private final MbMemberRepository    memberRepository;
    private final MbMemberAddrRepository addrRepository;
    private final MbMemberMapper         memberMapper;
    private final MbMemberAddrMapper     addrMapper;
    private final OdOrderMapper          orderMapper;
    private final OdClaimMapper          claimMapper;
    private final PmCouponMapper         couponMapper;
    private final PmCacheMapper          cacheMapper;
    private final PasswordEncoder        passwordEncoder;

    @Transactional(readOnly = true)
    public MbMemberDto getMyInfo() {
        String memberId = SecurityUtil.currentUserId();
        MbMemberDto dto = memberMapper.selectById(memberId);
        if (dto == null) throw new CmBizException("회원 정보를 찾을 수 없습니다.");
        return dto;
    }

    @Transactional
    public MbMemberDto updateMyInfo(MbMember body) {
        String memberId = SecurityUtil.currentUserId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        if (body.getMemberNm()      != null) member.setMemberNm(body.getMemberNm());
        if (body.getMemberPhone()   != null) member.setMemberPhone(body.getMemberPhone());
        if (body.getMemberGender()  != null) member.setMemberGender(body.getMemberGender());
        if (body.getBirthDate()     != null) member.setBirthDate(body.getBirthDate());
        if (body.getMemberZipCode() != null) member.setMemberZipCode(body.getMemberZipCode());
        if (body.getMemberAddr()    != null) member.setMemberAddr(body.getMemberAddr());
        if (body.getMemberAddrDetail() != null) member.setMemberAddrDetail(body.getMemberAddrDetail());
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());

        return memberMapper.selectById(memberId);
    }

    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        String memberId = SecurityUtil.currentUserId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getMemberPassword())) {
            throw new CmBizException("현재 비밀번호가 올바르지 않습니다.");
        }
        member.setMemberPassword(passwordEncoder.encode(newPassword));
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
    }

    @Transactional(readOnly = true)
    public List<MbMemberAddrDto> getMyAddrs() {
        String memberId = SecurityUtil.currentUserId();
        return addrMapper.selectList(Map.of("memberId", memberId));
    }

    @Transactional
    public MbMemberAddr saveAddr(MbMemberAddr body) {
        String memberId = SecurityUtil.currentUserId();
        body.setMemberId(memberId);
        body.setRegBy(memberId);
        body.setRegDate(LocalDateTime.now());
        return addrRepository.save(body);
    }

    @Transactional
    public void deleteAddr(String addrId) {
        String memberId = SecurityUtil.currentUserId();
        MbMemberAddr addr = addrRepository.findById(addrId)
                .orElseThrow(() -> new CmBizException("주소를 찾을 수 없습니다."));
        if (!memberId.equals(addr.getMemberId()))
            throw new CmBizException("접근 권한이 없습니다.");
        addrRepository.delete(addr);
    }

    @Transactional(readOnly = true)
    public List<OdOrderDto> getMyOrders(String siteId) {
        String memberId = SecurityUtil.currentUserId();
        Map<String, Object> p = new HashMap<>();
        p.put("memberId", memberId);
        if (siteId != null) p.put("siteId", siteId);
        return orderMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public List<OdClaimDto> getMyClaims(String siteId) {
        String memberId = SecurityUtil.currentUserId();
        Map<String, Object> p = new HashMap<>();
        p.put("memberId", memberId);
        if (siteId != null) p.put("siteId", siteId);
        return claimMapper.selectList(p);
    }

    @Transactional(readOnly = true)
    public List<PmCouponDto> getMyCoupons() {
        String memberId = SecurityUtil.currentUserId();
        return couponMapper.selectList(Map.of("memberId", memberId));
    }

    @Transactional(readOnly = true)
    public List<PmCacheDto> getMyCacheHistory() {
        String memberId = SecurityUtil.currentUserId();
        return cacheMapper.selectList(Map.of("memberId", memberId));
    }
}
