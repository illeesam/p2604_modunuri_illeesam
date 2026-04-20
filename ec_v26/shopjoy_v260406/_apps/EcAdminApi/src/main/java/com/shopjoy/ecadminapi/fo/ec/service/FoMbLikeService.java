package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbLikeMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbLikeRepository;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * FO 찜(Like) 서비스 — 현재 회원의 찜 목록 관리
 * URL: /api/fo/ec/mb/like
 *
 * targetTypeCd: PROD (상품) | BLTN (게시물) 등
 */
@Service
@RequiredArgsConstructor
public class FoMbLikeService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final MbLikeMapper     mapper;
    private final MbLikeRepository repository;

    @Transactional(readOnly = true)
    public List<MbLikeDto> getMyLikes(String siteId, String targetTypeCd) {
        String memberId = SecurityUtil.currentUserId();
        Map<String, Object> p = new java.util.HashMap<>();
        p.put("memberId", memberId);
        if (siteId      != null) p.put("siteId",       siteId);
        if (targetTypeCd!= null) p.put("targetTypeCd", targetTypeCd);
        return mapper.selectList(p);
    }

    /** 찜 토글: 없으면 추가, 있으면 삭제 → true=추가됨 false=취소됨 */
    @Transactional
    public boolean toggle(String siteId, String targetTypeCd, String targetId) {
        String memberId = SecurityUtil.currentUserId();
        Optional<MbLike> existing = repository.findAll().stream()
            .filter(l -> memberId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd())
                      && (siteId == null || siteId.equals(l.getSiteId())))
            .findFirst();

        if (existing.isPresent()) {
            repository.delete(existing.get());
            return false;
        } else {
            MbLike like = new MbLike();
            like.setLikeId(generateId());
            like.setSiteId(siteId);
            like.setMemberId(memberId);
            like.setTargetTypeCd(targetTypeCd);
            like.setTargetId(targetId);
            like.setRegBy(memberId);
            like.setRegDate(LocalDateTime.now());
            repository.save(like);
            return true;
        }
    }

    @Transactional
    public void unlike(String siteId, String targetTypeCd, String targetId) {
        String memberId = SecurityUtil.currentUserId();
        repository.findAll().stream()
            .filter(l -> memberId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd()))
            .findFirst()
            .ifPresent(repository::delete);
    }

    private String generateId() {
        String ts   = LocalDateTime.now().format(ID_FMT);
        String rand = String.format("%04d", (int) (Math.random() * 10000));
        return "LK" + ts + rand;
    }
}
