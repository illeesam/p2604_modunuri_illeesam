package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyNoticeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import com.shopjoy.ecadminapi.base.sy.repository.SyNoticeRepository;
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
public class SyNoticeService {

    private final SyNoticeRepository syNoticeRepository;

    @PersistenceContext
    private EntityManager em;

    /* 공지사항 키조회 */
    public SyNoticeDto.Item getById(String id) {
        SyNoticeDto.Item dto = syNoticeRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyNoticeDto.Item getByIdOrNull(String id) {
        return syNoticeRepository.selectById(id).orElse(null);
    }

    /* 공지사항 상세조회 */
    public SyNotice findById(String id) {
        return syNoticeRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyNotice findByIdOrNull(String id) {
        return syNoticeRepository.findById(id).orElse(null);
    }

    /* 공지사항 키검증 */
    public boolean existsById(String id) {
        return syNoticeRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syNoticeRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 공지사항 목록조회 */
    public List<SyNoticeDto.Item> getList(SyNoticeDto.Request req) {
        return syNoticeRepository.selectList(req);
    }

    /* 공지사항 페이지조회 */
    public SyNoticeDto.PageResponse getPageData(SyNoticeDto.Request req) {
        PageHelper.addPaging(req);
        return syNoticeRepository.selectPageList(req);
    }

    /* 공지사항 등록 */
    @Transactional
    public SyNotice create(SyNotice body) {
        body.setNoticeId(CmUtil.generateId("sy_notice"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 공지사항 저장 */
    @Transactional
    public SyNotice save(SyNotice entity) {
        if (!existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 SyNotice입니다: " + entity.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 공지사항 수정 */
    @Transactional
    public SyNotice update(String id, SyNotice body) {
        SyNotice entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "noticeId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyNotice saved = syNoticeRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 공지사항 수정 */
    @Transactional
    public SyNotice updateSelective(SyNotice entity) {
        if (entity.getNoticeId() == null) throw new CmBizException("noticeId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getNoticeId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getNoticeId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syNoticeRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 공지사항 삭제 */
    @Transactional
    public void delete(String id) {
        SyNotice entity = findById(id);
        syNoticeRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 공지사항 목록저장 */
    @Transactional
    public void saveList(List<SyNotice> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getNoticeId() != null)
            .map(SyNotice::getNoticeId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syNoticeRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyNotice> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getNoticeId() != null)
            .toList();
        for (SyNotice row : updateRows) {
            SyNotice entity = findById(row.getNoticeId());
            VoUtil.voCopyExclude(row, entity, "noticeId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syNoticeRepository.save(entity);
        }
        em.flush();

        List<SyNotice> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyNotice row : insertRows) {
            row.setNoticeId(CmUtil.generateId("sy_notice"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syNoticeRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
