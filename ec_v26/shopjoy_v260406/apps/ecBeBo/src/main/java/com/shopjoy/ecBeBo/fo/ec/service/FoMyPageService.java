package com.shopjoy.ecBeBo.fo.ec.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecBeBo.base.ec.mb.data.entity.MbMemberAddr;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberAddrRepository;
import com.shopjoy.ecBeBo.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecBeBo.common.util.CmUtil;
import com.shopjoy.ecBeBo.common.util.VoUtil;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderDto;
import com.shopjoy.ecBeBo.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdOrderItemRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecBeBo.base.ec.pm.data.dto.PmCouponDto;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmCacheRepository;
import com.shopjoy.ecBeBo.base.ec.pm.repository.PmCouponRepository;
import com.shopjoy.ecBeBo.base.ec.cm.data.dto.CmChattDto;
import com.shopjoy.ecBeBo.base.ec.cm.repository.CmChattRepository;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyContactDto;
import com.shopjoy.ecBeBo.base.sy.repository.SyContactRepository;
import com.shopjoy.ecBeBo.common.exception.CmBizException;
import com.shopjoy.ecBeBo.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;


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
    private final OdOrderItemRepository  orderItemRepository;
    private final OdClaimRepository      claimRepository;
    private final PmCouponRepository     couponRepository;
    private final PmCacheRepository      cacheRepository;
    private final SyContactRepository    contactRepository;
    private final CmChattRepository      chattRepository;
    private final PasswordEncoder        passwordEncoder;
    @PersistenceContext
    private EntityManager em;

    /** getMyInfo — 조회 */
    public MbMemberDto.Item getMyInfo() {
        String memberId = SecurityUtil.getAuthUser().authId();
        // [쿼리 메서드] Member 단건 조회
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
        // [쿼리 메서드] Addr 목록 조회
        member.setAddrs(addrRepository.selectList(addrReq)); // 배송지목록
    }

    /** updateMyInfo — 수정 */
    @Transactional
    public MbMemberDto.Item updateMyInfo(MbMember body) {
        String memberId = SecurityUtil.getAuthUser().authId();
        // [쿼리 메서드] Member 단건 조회
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));

        VoUtil.voCopyInclude(body, member, "memberNm^memberPhone^memberGender^birthDate^memberZipCode^memberAddr^memberAddrDetail");
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] Member 저장
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("회원정보 수정에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        // [쿼리 메서드] Member 단건 조회
        return memberRepository.selectById(memberId).orElse(null);
    }

    /** changePassword */
    @Transactional
    public void changePassword(String currentPassword, String newPassword) {
        String memberId = SecurityUtil.getAuthUser().authId();
        // [쿼리 메서드] Member 단건 조회
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));

        if (!passwordEncoder.matches(currentPassword, member.getLoginPwdHash())) {
            throw new CmBizException("현재 비밀번호가 올바르지 않습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        member.setLoginPwdHash(passwordEncoder.encode(newPassword));
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        // [쿼리 메서드] Member 저장
        MbMember saved = memberRepository.save(member);
        if (saved == null) throw new CmBizException("비밀번호 변경에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
    }

    /** getMyAddrs — 조회 */
    public List<MbMemberAddrDto.Item> getMyAddrs() {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMemberAddrDto.Request req = new MbMemberAddrDto.Request();
        req.setMemberId(memberId);
        // [쿼리 메서드] Addr 목록 조회
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
        // [쿼리 메서드] Addr 저장
        MbMemberAddr saved = addrRepository.save(body);
        if (saved == null) throw new CmBizException("주소 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        return saved;
    }

    /** deleteAddr — 삭제 */
    @Transactional
    public void deleteAddr(String addrId) {
        String memberId = SecurityUtil.getAuthUser().authId();
        // [쿼리 메서드] Addr 단건 조회
        MbMemberAddr addr = addrRepository.findById(addrId)
                .orElseThrow(() -> new CmBizException("주소를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));
        if (!memberId.equals(addr.getMemberId()))
            throw new CmBizException("접근 권한이 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        // [쿼리 메서드] Addr 삭제
        addrRepository.delete(addr);
    }

    /** getMyOrders — 조회 (주문상품 orderItems 일괄 채워 반환) */
    public List<OdOrderDto.Item> getMyOrders(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Order 목록 조회
        List<OdOrderDto.Item> orders = orderRepository.selectList(req);
        _fillOrderItems(orders);
        return orders;
    }

    /** getMyOrdersPage — 서버사이드 페이징 조회 (현재 페이지에 orderItems 채워 반환) */
    public BasePage<OdOrderDto.Item> getMyOrdersPage(OdOrderDto.Request req) {
        if (req == null) req = new OdOrderDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Order 페이지 조회
        BasePage<OdOrderDto.Item> page = orderRepository.selectPageData(req);
        _fillOrderItems(page.getPageList());
        return page;
    }

    /** _fillOrderItems — 주문 목록에 orderItems 일괄 조회·분배 (1회 IN 쿼리) */
    private void _fillOrderItems(List<OdOrderDto.Item> orders) {
        if (orders == null || orders.isEmpty()) return;
        List<String> orderIds = orders.stream()
            .map(OdOrderDto.Item::getOrderId).filter(Objects::nonNull).distinct().toList();
        if (orderIds.isEmpty()) return;
        OdOrderItemDto.Request itemReq = new OdOrderItemDto.Request();
        itemReq.setOrderIds(orderIds);
        // [쿼리 메서드] OrderItem 목록 조회
        Map<String, List<OdOrderItemDto.Item>> itemMap = orderItemRepository.selectList(itemReq).stream()
            .collect(Collectors.groupingBy(OdOrderItemDto.Item::getOrderId));
        for (OdOrderDto.Item o : orders) {
            o.setOrderItems(itemMap.getOrDefault(o.getOrderId(), List.of()));
        }
    }

    /** getMyClaims — 조회 */
    public List<OdClaimDto.Item> getMyClaims(OdClaimDto.Request req) {
        if (req == null) req = new OdClaimDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Claim 목록 조회
        return claimRepository.selectList(req);
    }

    /** getMyClaimsPage — 서버사이드 페이징 조회 */
    public BasePage<OdClaimDto.Item> getMyClaimsPage(OdClaimDto.Request req) {
        if (req == null) req = new OdClaimDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Claim 페이지 조회
        return claimRepository.selectPageData(req);
    }

    /** getMyCoupons — 조회 */
    public List<PmCouponDto.Item> getMyCoupons(PmCouponDto.Request req) {
        if (req == null) req = new PmCouponDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Coupon 목록 조회
        return couponRepository.selectList(req);
    }

    /** getMyCouponsPage — 서버사이드 페이징 조회 */
    public BasePage<PmCouponDto.Item> getMyCouponsPage(PmCouponDto.Request req) {
        if (req == null) req = new PmCouponDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Coupon 페이지 조회
        return couponRepository.selectPageData(req);
    }

    /** getMyCacheHistory — 조회 */
    public List<PmCacheDto.Item> getMyCacheHistory(PmCacheDto.Request req) {
        if (req == null) req = new PmCacheDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Cache 목록 조회
        return cacheRepository.selectList(req);
    }

    /** getMyCacheHistoryPage — 서버사이드 페이징 조회 */
    public BasePage<PmCacheDto.Item> getMyCacheHistoryPage(PmCacheDto.Request req) {
        if (req == null) req = new PmCacheDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Cache 페이지 조회
        return cacheRepository.selectPageData(req);
    }

    /** getMyInquiries — 조회 (내 1:1 문의 목록, 기간/상태 검색은 req 로 위임) */
    public List<SyContactDto.Item> getMyInquiries(SyContactDto.Request req) {
        if (req == null) req = new SyContactDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Contact 목록 조회
        return contactRepository.selectList(req);
    }

    /** getMyInquiriesPage — 서버사이드 페이징 조회 */
    public BasePage<SyContactDto.Item> getMyInquiriesPage(SyContactDto.Request req) {
        if (req == null) req = new SyContactDto.Request();
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Contact 페이지 조회
        return contactRepository.selectPageData(req);
    }

    /* 채팅은 cm_chatt 를 쓴다.
       예전엔 cm_chatt_room(CmChattRoom) 을 조회했는데 그 테이블이 DB 에 존재하지 않아
       /api/fo/my/chat/list · /chat/page 가 항상 500 이었다 (2026-08-01 수정).
       회원 필터는 CmChattDto.Request.refId (= member_id) 로 건다. */

    /** getMyChats — 조회 (내 채팅 목록, 기간 검색은 req 로 위임) */
    public List<CmChattDto.Item> getMyChats(CmChattDto.Request req) {
        if (req == null) req = new CmChattDto.Request();
        req.setRefId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Chatt 목록 조회
        return chattRepository.selectList(req);
    }

    /** getMyChatsPage — 서버사이드 페이징 조회 */
    public BasePage<CmChattDto.Item> getMyChatsPage(CmChattDto.Request req) {
        if (req == null) req = new CmChattDto.Request();
        req.setRefId(SecurityUtil.getAuthUser().authId());
        // [쿼리 메서드] Chatt 페이지 조회
        return chattRepository.selectPageData(req);
    }
}
