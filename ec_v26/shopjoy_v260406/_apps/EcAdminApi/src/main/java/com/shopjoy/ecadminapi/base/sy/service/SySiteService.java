package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.mapper.SySiteMapper;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SySiteService {

    private final SySiteMapper sySiteMapper;
    private final SySiteRepository sySiteRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    /** getById — 단건조회 (MyBatis, JOIN 필드 포함) */
    public SySiteDto.Item getById(String id) {
        SySiteDto.Item dto = sySiteMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    /** findById — 단건조회 (JPA) */
    public SySite findById(String id) {
        return sySiteRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    /** existsById — 존재 여부 확인 (JPA) */
    public boolean existsById(String id) {
        return sySiteRepository.existsById(id);
    }

    /** getList — 목록조회 */
    public List<SySiteDto.Item> getList(SySiteDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return sySiteMapper.selectList(req);
    }

    /** getPageData — 페이징조회 */
    public SySiteDto.PageResponse getPageData(SySiteDto.Request req) {
        PageHelper.addPaging(req);
        SySiteDto.PageResponse res = new SySiteDto.PageResponse();
        List<SySiteDto.Item> list = sySiteMapper.selectPageList(req);
        long count = sySiteMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    // ── 변경 ────────────────────────────────────────────────────

    /** create — 생성 (JPA) */
    @Transactional
    public SySite create(SySite body) {
        body.setSiteId(CmUtil.generateId("sy_site"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSiteId());
    }

    /** save — 전체 저장 (ID 존재 검증) */
    @Transactional
    public SySite save(SySite entity) {
        if (!existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 SySite입니다: " + entity.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getSiteId());
    }

    /** update — 선택 필드 수정 (JPA + VoUtil voCopyExclude) */
    @Transactional
    public SySite update(String id, SySite body) {
        SySite entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "siteId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SySite saved = sySiteRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    /** updatePartial — 선택 필드 수정 (MyBatis selective UPDATE) */
    @Transactional
    public SySite updatePartial(SySite entity) {
        if (entity.getSiteId() == null)
            throw new CmBizException("siteId 가 필요합니다.");
        if (!existsById(entity.getSiteId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSiteId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = sySiteMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getSiteId());
    }

    /** delete — 삭제 (JPA) */
    @Transactional
    public void delete(String id) {
        SySite entity = findById(id);
        sySiteRepository.delete(entity);
        em.flush();
        if (existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public List<SySite> saveList(List<SySite> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSiteId() != null)
            .map(SySite::getSiteId)
            .toList();
        if (!deleteIds.isEmpty()) {
            sySiteRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<String> upsertedIds = new ArrayList<>();
        List<SySite> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSiteId() != null)
            .toList();
        for (SySite row : updateRows) {
            SySite entity = findById(row.getSiteId());
            VoUtil.voCopyExclude(row, entity, "siteId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            sySiteRepository.save(entity);
            upsertedIds.add(entity.getSiteId());
        }
        em.flush();

        List<SySite> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SySite row : insertRows) {
            row.setSiteId(CmUtil.generateId("sy_site"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            sySiteRepository.save(row);
            upsertedIds.add(row.getSiteId());
        }
        em.flush();
        em.clear();

        List<SySite> result = new ArrayList<>();
        for (String id : upsertedIds) {
            result.add(findById(id));
        }
        return result;
    }
}
