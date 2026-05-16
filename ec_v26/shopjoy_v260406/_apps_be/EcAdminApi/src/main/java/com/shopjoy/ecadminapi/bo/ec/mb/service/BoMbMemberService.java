package com.shopjoy.ecadminapi.bo.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberAddrDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbMemberSnsDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberAddrService;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberService;
import com.shopjoy.ecadminapi.base.ec.mb.service.MbMemberSnsService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import com.shopjoy.ecadminapi.common.util.CmUtil;

/**
 * BO 회원 서비스 — base MbMemberService 위임 (thin wrapper) + changeStatus.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoMbMemberService {

    private final MbMemberService mbMemberService;
    private final MbMemberAddrService mbMemberAddrService;
    private final MbMemberSnsService mbMemberSnsService;
    private final MbMemberRepository mbMemberRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public MbMemberDto.Item getById(String id) {
        MbMemberDto.Item dto = mbMemberService.getById(id);
        _itemFillRelations(dto);
        return dto;
    }
    /* 목록조회 */
    public List<MbMemberDto.Item> getList(MbMemberDto.Request req) {
        List<MbMemberDto.Item> list = mbMemberService.getList(req);
        _listFillRelations(list);
        return list;
    }
    /* 페이지조회 */
    public MbMemberDto.PageResponse getPageData(MbMemberDto.Request req) {
        MbMemberDto.PageResponse res = mbMemberService.getPageData(req);
        _listFillRelations(res.getPageList());
        return res;
    }

    /** _itemFillRelations — 단건 연관조회 (addrs/snsList 채우기) */
    private void _itemFillRelations(MbMemberDto.Item member) {
        if (member == null) return;
        String memberId = member.getMemberId();

        // 하위 배송지 목록 조회 (memberId 기준)
        MbMemberAddrDto.Request addrReq = new MbMemberAddrDto.Request();
        addrReq.setMemberId(memberId);
        member.setAddrs(mbMemberAddrService.getList(addrReq)); // 배송지목록

        // 하위 SNS 연동 목록 조회 (memberId 기준)
        MbMemberSnsDto.Request snsReq = new MbMemberSnsDto.Request();
        snsReq.setMemberId(memberId);
        member.setSnsList(mbMemberSnsService.getList(snsReq)); // SNS목록
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (addrs/snsList 를 각각 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하는 _itemFillRelations 와 달리, N개 행이라도 addr 1회 + sns 1회만 조회한다.
     */
    private void _listFillRelations(List<MbMemberDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 부모 키 수집 (중복 제거)
        List<String> memberIds = list.stream()
            .map(MbMemberDto.Item::getMemberId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (memberIds.isEmpty()) return;

        // 배송지 일괄조회 → Map<memberId, List<addr>>
        MbMemberAddrDto.Request addrReq = new MbMemberAddrDto.Request();
        addrReq.setMemberIds(memberIds);
        Map<String, List<MbMemberAddrDto.Item>> addrMap = mbMemberAddrService.getList(addrReq).stream()
            .collect(Collectors.groupingBy(MbMemberAddrDto.Item::getMemberId));

        // SNS 연동 일괄조회 → Map<memberId, List<sns>>
        MbMemberSnsDto.Request snsReq = new MbMemberSnsDto.Request();
        snsReq.setMemberIds(memberIds);
        Map<String, List<MbMemberSnsDto.Item>> snsMap = mbMemberSnsService.getList(snsReq).stream()
            .collect(Collectors.groupingBy(MbMemberSnsDto.Item::getMemberId));

        // 각 항목에 분배
        for (MbMemberDto.Item member : list) {
            String mid = member.getMemberId();
            member.setAddrs(addrMap.getOrDefault(mid, List.of()));     // 배송지목록
            member.setSnsList(snsMap.getOrDefault(mid, List.of()));    // SNS목록
        }
    }

    @Transactional public MbMember create(MbMember body) { return mbMemberService.create(body); }
    @Transactional public MbMember update(String id, MbMember body) { return mbMemberService.update(id, body); }
    @Transactional public void delete(String id) { mbMemberService.delete(id); }
    @Transactional public void saveList(List<MbMember> rows) { mbMemberService.saveList(rows); }

    /** changeStatus — memberStatusCd 변경 (이력 보존) */
    @Transactional
    public MbMemberDto.Item changeStatus(String id, String statusCd) {
        MbMember entity = mbMemberRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않습니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
        entity.setMemberStatusCdBefore(entity.getMemberStatusCd());
        entity.setMemberStatusCd(statusCd);
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        mbMemberRepository.save(entity);
        em.flush();
        return mbMemberService.getById(id);
    }
}
