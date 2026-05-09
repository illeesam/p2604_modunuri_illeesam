package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberAddrMapper;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbMemberMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
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
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;

/**
 * FO 마이페이지 서비스 — 현재 로그인 회원 전용
 * URL: /api/fo/ec/my
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
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
    @PersistenceContext
    private EntityManager em;

    /** getMyInfo — 조회 */
    public MbMemberDto.Item getMyInfo() {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberDto.Item dto = memberMapper.selectById(memberId);
        if (dto == null) throw new CmBizException("회원 정보를 찾을 수 없습니다.");
        return dto;
    }

    /** updateMyInfo — 수정 */
    @Transactional
    public MbMemberDto.Item updateMyInfo(MbMember body) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        VoUtil.voCopyInclude(body, member, "memberNm^memberPhone^memberGender^birthDate^memberZipCode^memberAddr^memberAddrDetail");
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("회원정보 수정에 실패했습니다.");
        em.flush();
        return memberMapper.selectById(memberId);
    }

    /** changePassword */
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        if (!passwordEncoder.matches(currentPassword, member.getLoginPwdHash())) {
            throw new CmBizException("현재 비밀번호가 올바르지 않습니다.");
        }
        member.setLoginPwdHash(passwordEncoder.encode(newPassword));
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("비밀번호 변경에 실패했습니다.");
        em.flush();
    }

    /** getMyAddrs — 조회 */
    public List<MbMemberAddrDto.Item> getMyAddrs() {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberAddrDto.Request req = new MbMemberAddrDto.Request();
        req.setMemberId(memberId);
        return addrMapper.selectList(req);
    }

    /** saveAddr — 저장 */
    @Transactional
    public MbMemberAddr saveAddr(MbMemberAddr body) {
        String memberId = SecurityUtil.getAuthUser().authId();
        if (body.getMemberAddrId() == null) {
            body.setMemberAddrId(CmUtil.generateId("mb_member_addr"));
        }
        body.setMemberId(memberId);
        body.setRegBy(memberId);
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(memberId);
        body.setUpdDate(LocalDateTime.now());
        MbMemberAddr saved = addrRepository.save(body);
        if (saved == null) throw new CmBizException("주소 저장에 실패했습니다.");
        return saved;
    }

    /** deleteAddr — 삭제 */
    @Transactional
    public void deleteAddr(String addrId) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberAddr addr = addrRepository.findById(addrId)
                .orElseThrow(() -> new CmBizException("주소를 찾을 수 없습니다."));
        if (!memberId.equals(addr.getMemberId()))
            throw new CmBizException("접근 권한이 없습니다.");
        addrRepository.delete(addr);
    }

    /** getMyOrders — 조회 */
    public List<OdOrderDto> getMyOrders(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return orderMapper.selectList(p);
    }

    /** getMyClaims — 조회 */
    public List<OdClaimDto> getMyClaims(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return claimMapper.selectList(p);
    }

    /** getMyCoupons — 조회 */
    public List<PmCouponDto> getMyCoupons(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return couponMapper.selectList(p);
    }

    /** getMyCacheHistory — 조회 */
    public List<PmCacheDto> getMyCacheHistory(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return cacheMapper.selectList(p);
    }
}
