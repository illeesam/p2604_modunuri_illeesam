package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmBlogGoodDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmBlogGoodRepository;
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
public class CmBlogGoodService {

    private final CmBlogGoodRepository cmBlogGoodRepository;

    @PersistenceContext
    private EntityManager em;

    public CmBlogGoodDto.Item getById(String id) {
        CmBlogGoodDto.Item dto = cmBlogGoodRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogGoodDto.Item getByIdOrNull(String id) {
        return cmBlogGoodRepository.selectById(id).orElse(null);
    }

    public CmBlogGood findById(String id) {
        return cmBlogGoodRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmBlogGood findByIdOrNull(String id) {
        return cmBlogGoodRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmBlogGoodRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmBlogGoodRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmBlogGoodDto.Item> getList(CmBlogGoodDto.Request req) {
        return cmBlogGoodRepository.selectList(req);
    }

    public CmBlogGoodDto.PageResponse getPageData(CmBlogGoodDto.Request req) {
        PageHelper.addPaging(req);
        return cmBlogGoodRepository.selectPageList(req);
    }

    @Transactional
    public CmBlogGood create(CmBlogGood body) {
        body.setLikeId(CmUtil.generateId("cm_blog_good"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmBlogGood saved = cmBlogGoodRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogGood save(CmBlogGood entity) {
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 CmBlogGood입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogGood saved = cmBlogGoodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogGood update(String id, CmBlogGood body) {
        CmBlogGood entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "likeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmBlogGood saved = cmBlogGoodRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmBlogGood updateSelective(CmBlogGood entity) {
        if (entity.getLikeId() == null) throw new CmBizException("likeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLikeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLikeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmBlogGoodRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmBlogGood entity = findById(id);
        cmBlogGoodRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<CmBlogGood> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getLikeId() != null)
            .map(CmBlogGood::getLikeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmBlogGoodRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmBlogGood> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getLikeId() != null)
            .toList();
        for (CmBlogGood row : updateRows) {
            CmBlogGood entity = findById(row.getLikeId());
            VoUtil.voCopyExclude(row, entity, "likeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmBlogGoodRepository.save(entity);
        }
        em.flush();

        List<CmBlogGood> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmBlogGood row : insertRows) {
            row.setLikeId(CmUtil.generateId("cm_blog_good"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmBlogGoodRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
