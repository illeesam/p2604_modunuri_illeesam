package com.shopjoy.ecadminapi.fo.ec.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.mapper.MbLikeMapper;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbLikeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;

/**
 * FO 찜(Like) 서비스 — 현재 회원의 찜 목록 관리
 * URL: /api/fo/ec/mb/like
 *
 * targetTypeCd: PROD (상품) | BLTN (게시물) 등
 */
@Service
@RequiredArgsConstructor
public class FoMbLikeService {


    private final MbLikeMapper     mapper;
    private final MbLikeRepository repository;

    @Transactional(readOnly = true)
    public List<MbLikeDto> getMyLikes(Map<String, Object> p) {
        p.put("memberId", SecurityUtil.getAuthUser().authId());
        return mapper.selectList(p);
    }

    /** 찜 토글: 없으면 추가, 있으면 삭제 → true=추가됨 false=취소됨 */
    @Transactional
    public boolean toggle(String targetTypeCd, String targetId, Map<String, Object> p) {
        String authId = SecurityUtil.getAuthUser().authId();
        Optional<MbLike> existing = repository.findAll().stream()
            .filter(l -> authId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd())
                      && (p.get("siteId") == null || p.get("siteId").equals(l.getSiteId())))
            .findFirst();

        if (existing.isPresent()) {
            repository.delete(existing.get());
            return false;
        } else {
            MbLike like = new MbLike();
            like.setLikeId(CmUtil.generateId("mb_like"));
            like.setSiteId((String) p.get("siteId"));
            like.setMemberId(authId);
            like.setTargetTypeCd(targetTypeCd);
            like.setTargetId(targetId);
            like.setRegBy(authId);
            like.setRegDate(LocalDateTime.now());
            like.setUpdBy(authId);
            like.setUpdDate(LocalDateTime.now());
            MbLike saved = repository.save(like);
            if (saved == null) throw new CmBizException("찜 추가에 실패했습니다.");
            return true;
        }
    }

    @Transactional
    public void unlike(String targetTypeCd, String targetId, Map<String, Object> p) {
        String authId = SecurityUtil.getAuthUser().authId();
        repository.findAll().stream()
            .filter(l -> authId.equals(l.getMemberId())
                      && targetId.equals(l.getTargetId())
                      && targetTypeCd.equals(l.getTargetTypeCd()))
            .findFirst()
            .ifPresent(repository::delete);
    }

}
