package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbsDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbs;
import com.shopjoy.ecadminapi.base.sy.repository.SyBbsRepository;
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
public class SyBbsService {

    private final SyBbsRepository syBbsRepository;

    @PersistenceContext
    private EntityManager em;

    /* 게시판 게시물 키조회 */
    public SyBbsDto.Item getById(String id) {
        SyBbsDto.Item dto = syBbsRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbsDto.Item getByIdOrNull(String id) {
        return syBbsRepository.selectById(id).orElse(null);
    }

    /* 게시판 게시물 상세조회 */
    public SyBbs findById(String id) {
        return syBbsRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyBbs findByIdOrNull(String id) {
        return syBbsRepository.findById(id).orElse(null);
    }

    /* 게시판 게시물 키검증 */
    public boolean existsById(String id) {
        return syBbsRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syBbsRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 게시판 게시물 목록조회 */
    public List<SyBbsDto.Item> getList(SyBbsDto.Request req) {
        return syBbsRepository.selectList(req);
    }

    /* 게시판 게시물 페이지조회 */
    public SyBbsDto.PageResponse getPageData(SyBbsDto.Request req) {
        PageHelper.addPaging(req);
        return syBbsRepository.selectPageList(req);
    }

    /* 게시판 게시물 등록 */
    @Transactional
    public SyBbs create(SyBbs body) {
        body.setBbsId(CmUtil.generateId("sy_bbs"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 게시물 저장 */
    @Transactional
    public SyBbs save(SyBbs entity) {
        if (!existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 SyBbs입니다: " + entity.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 게시물 수정 */
    @Transactional
    public SyBbs update(String id, SyBbs body) {
        SyBbs entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "bbsId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyBbs saved = syBbsRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 게시판 게시물 수정 */
    @Transactional
    public SyBbs updateSelective(SyBbs entity) {
        if (entity.getBbsId() == null) throw new CmBizException("bbsId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getBbsId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getBbsId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syBbsRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 게시판 게시물 삭제 */
    @Transactional
    public void delete(String id) {
        SyBbs entity = findById(id);
        syBbsRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 게시판 게시물 목록저장 */
    @Transactional
    public void saveList(List<SyBbs> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getBbsId() != null)
            .map(SyBbs::getBbsId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syBbsRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyBbs> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getBbsId() != null)
            .toList();
        for (SyBbs row : updateRows) {
            SyBbs entity = findById(row.getBbsId());
            VoUtil.voCopyExclude(row, entity, "bbsId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syBbsRepository.save(entity);
        }
        em.flush();

        List<SyBbs> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyBbs row : insertRows) {
            row.setBbsId(CmUtil.generateId("sy_bbs"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syBbsRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
