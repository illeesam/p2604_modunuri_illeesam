package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbLikeRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdProdService;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * FO 찜(Like) 서비스 — 현재 회원의 찜 목록 관리
 * URL: /api/fo/ec/mb/like
 *
 * targetTypeCd: PROD (상품) | BLTN (게시물) 등
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoMbLikeService {

    private final MbLikeRepository mbLikeRepository;
    private final PdProdService    pdProdService;

    private static final String TARGET_PROD = "PROD";

    /** getMyLikes — 조회 (현재 회원 찜 목록) */
    public List<MbLikeDto.Item> getMyLikes(MbLikeDto.Request req) {
        if (req == null) req = new MbLikeDto.Request();
        // memberId는 보안 컨텍스트에서 강제
        req.setMemberId(SecurityUtil.getAuthUser().authId());
        List<MbLikeDto.Item> list = mbLikeRepository.selectList(req);
        _listFillRelations(list);
        return list;
    }

    /**
     * _listFillRelations — 목록 일괄 연관조회 (targetTypeCd=PROD 인 찜의 상품 단건을 한 번의 쿼리로 조회 후 분배)
     * 행마다 쿼리하지 않고, N개 행이라도 prod 1회만 조회한다.
     */
    private void _listFillRelations(List<MbLikeDto.Item> list) {
        if (list == null || list.isEmpty()) return;

        // 상품 찜의 targetId(=prodId) 수집 (중복 제거)
        List<String> prodIds = list.stream()
            .filter(l -> TARGET_PROD.equals(l.getTargetTypeCd()))
            .map(MbLikeDto.Item::getTargetId)
            .filter(Objects::nonNull)
            .distinct()
            .toList();
        if (prodIds.isEmpty()) return;

        // 상품 일괄조회 → Map<prodId, prod>
        PdProdDto.Request prodReq = new PdProdDto.Request();
        prodReq.setProdIds(prodIds);
        Map<String, PdProdDto.Item> prodMap = pdProdService.getList(prodReq).stream()
            .collect(Collectors.toMap(PdProdDto.Item::getProdId, x -> x, (a, b) -> a));

        // 각 항목에 분배 (PROD 인 경우만)
        for (MbLikeDto.Item like : list) {
            if (TARGET_PROD.equals(like.getTargetTypeCd()))
                like.setProd(prodMap.get(like.getTargetId())); // 상품단건
        }
    }

    /** 찜 토글: 없으면 추가, 있으면 삭제 → true=추가됨 false=취소됨 */
    @Transactional
    public boolean toggle(String targetTypeCd, String targetId, String siteId) {
        String authId = SecurityUtil.getAuthUser().authId();
        Optional<MbLike> existing = mbLikeRepository.findAll().stream()
            .filter(l -> authId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd())
                      && (siteId == null || siteId.equals(l.getSiteId())))
            .findFirst();

        if (existing.isPresent()) {
            mbLikeRepository.delete(existing.get());
            return false;
        } else {
            MbLike like = new MbLike();
            like.setLikeId(CmUtil.generateId("mb_like"));
            like.setSiteId(siteId);
            like.setMemberId(authId);
            like.setTargetTypeCd(targetTypeCd);
            like.setTargetId(targetId);
            like.setRegBy(authId);
            like.setRegDate(LocalDateTime.now());
            like.setUpdBy(authId);
            like.setUpdDate(LocalDateTime.now());
            MbLike saved = mbLikeRepository.save(like);
            if (saved == null) throw new CmBizException("찜 추가에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return true;
        }
    }

    /** unlike */
    @Transactional
    public void unlike(String targetTypeCd, String targetId) {
        String authId = SecurityUtil.getAuthUser().authId();
        mbLikeRepository.findAll().stream()
            .filter(l -> authId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd()))
            .findFirst()
            .ifPresent(mbLikeRepository::delete);
    }
}
