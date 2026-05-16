package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbLikeDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbLikeRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MbLikeService {

    private final MbLikeRepository mbLikeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 좋아요(찜) 키조회 */
    public MbLikeDto.Item getById(String id) {
        MbLikeDto.Item dto = mbLikeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbLikeDto.Item getByIdOrNull(String id) {
        return mbLikeRepository.selectById(id).orElse(null);
    }

    /* 좋아요(찜) 상세조회 */
    public MbLike findById(String id) {
        return mbLikeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbLike findByIdOrNull(String id) {
        return mbLikeRepository.findById(id).orElse(null);
    }

    /* 좋아요(찜) 키검증 */
    public boolean existsById(String id) {
        return mbLikeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbLikeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 좋아요(찜) 목록조회 */
    public List<MbLikeDto.Item> getList(MbLikeDto.Request req) {
        return mbLikeRepository.selectList(req);
    }

    /* 좋아요(찜) 페이지조회 */
    public MbLikeDto.PageResponse getPageData(MbLikeDto.Request req) {
        PageHelper.addPaging(req);
        return mbLikeRepository.selectPageList(req);
    }

    /* 좋아요(찜) 등록 */
    @Transactional
    public MbLike create(MbLike body) {
        body.setLikeId(CmUtil.generateId("mb_like"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbLike saved = mbLikeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 좋아요(찜) 저장 */
    @Transactional
    public MbLike save(MbLike entity) {
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 MbLike입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbLike saved = mbLikeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 좋아요(찜) 수정 */
    @Transactional
    public MbLike update(String id, MbLike body) {
        MbLike entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "likeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbLike saved = mbLikeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 좋아요(찜) 수정 */
    @Transactional
    public MbLike updateSelective(MbLike entity) {
        if (entity.getLikeId() == null) throw new CmBizException("likeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbLikeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 좋아요(찜) 삭제 */
    @Transactional
    public void delete(String id) {
        MbLike entity = findById(id);
        mbLikeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 좋아요(찜) 목록저장 */
    @Transactional
    public void saveList(List<MbLike> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLikeId() != null)
            .map(MbLike::getLikeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbLikeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<MbLike> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLikeId() != null)
            .toList();
        for (MbLike row : updateRows) {
            MbLike entity = findById(row.getLikeId());
            VoUtil.voCopyExclude(row, entity, "likeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            mbLikeRepository.save(entity);
        }
        em.flush();

        List<MbLike> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbLike row : insertRows) {
            row.setLikeId(CmUtil.generateId("mb_like"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbLikeRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
