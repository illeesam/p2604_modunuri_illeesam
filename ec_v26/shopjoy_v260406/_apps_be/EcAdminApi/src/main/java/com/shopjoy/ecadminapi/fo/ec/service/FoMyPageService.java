package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmCouponRepository;
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


/**
 * FO 마이페이지 서비스 — 현재 로그인 회원 전용
 * URL: /api/fo/ec/my
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoMyPageService {

    private final MbMemberRepository     memberRepository;
    private final MbMemberAddrRepository addrRepository;
    private final OdOrderRepository      orderRepository;
    private final OdClaimRepository      claimRepository;
    private final PmCouponRepository     couponRepository;
    private final PmCacheRepository      cacheRepository;
    private final PasswordEncoder        passwordEncoder;
    @PersistenceContext
    private EntityManager em;

    /** getMyInfo — 조회 */
    public MbMemberDto.Item getMyInfo() {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberDto.Item dto = memberRepository.selectById(memberId).orElse(null);
        if (dto == null) throw new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        _itemFillRelations(dto);
        return dto;
    }

    /** _itemFillRelations — 단건 연관조회 (addrs 채우기) */
    private void _itemFillRelations(MbMemberDto.Item member) {
        if (member == null) return;

        // 하위 배송지 목록 조회 (memberId 기준)
        MbMemberAddrDto.Request addrReq = new MbMemberAddrDto.Request();
        addrReq.setMemberId(member.getMemberId());
        member.setAddrs(addrRepository.selectList(addrReq)); // 배송지목록
    }

    /** updateMyInfo — 수정 */
    @Transactional
    public MbMemberDto.Item updateMyInfo(MbMember body) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));

        VoUtil.voCopyInclude(body, member, "memberNm^memberPhone^memberGender^birthDate^memberZipCode^memberAddr^memberAddrDetail");
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("회원정보 수정에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return memberRepository.selectById(memberId).orElse(null);
    }

    /** changePassword */
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));

        if (!passwordEncoder.matches(currentPassword, member.getLoginPwdHash())) {
            throw new CmBizException("현재 비밀번호가 올바르지 않습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        member.setLoginPwdHash(passwordEncoder.encode(newPassword));
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("비밀번호 변경에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
    }

    /** getMyAddrs — 조회 */
    public List<MbMemberAddrDto.Item> getMyAddrs() {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberAddrDto.Request req = new MbMemberAddrDto.Request();
        req.setMemberId(memberId);
        return addrRepository.selectList(req);
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
        if (saved == null) throw new CmBizException("주소 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** deleteAddr — 삭제 */
    @Transactional
    public void deleteAddr(String addrId) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberAddr addr = addrRepository.findById(addrId)
                .orElseThrow(() -> new CmBizException("주소를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));
        if (!memberId.equals(addr.getMemberId()))
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        addrRepository.delete(addr);
    }

    /** getMyOrders — 조회 */
    public List<OdOrderDto.Item> getMyOrders(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        return orderRepository.selectList(req);
    }

    /** getMyClaims — 조회 */
    public List<OdClaimDto.Item> getMyClaims(OdClaimDto.Request req) {
        if (req == null) req = new OdClaimDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        return claimRepository.selectList(req);
    }

    /** getMyCoupons — 조회 */
    public List<PmCouponDto.Item> getMyCoupons(PmCouponDto.Request req) {
        if (req == null) req = new PmCouponDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        return couponRepository.selectList(req);
    }

    /** getMyCacheHistory — 조회 */
    public List<PmCacheDto.Item> getMyCacheHistory(PmCacheDto.Request req) {
        if (req == null) req = new PmCacheDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        return cacheRepository.selectList(req);
    }
}
