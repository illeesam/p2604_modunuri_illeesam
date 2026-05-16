package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAttachGrpDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttachGrp;
import com.shopjoy.ecadminapi.base.sy.repository.SyAttachGrpRepository;
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
public class SyAttachGrpService {

    private final SyAttachGrpRepository syAttachGrpRepository;

    @PersistenceContext
    private EntityManager em;

    /* 첨부파일 그룹 키조회 */
    public SyAttachGrpDto.Item getById(String id) {
        SyAttachGrpDto.Item dto = syAttachGrpRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttachGrpDto.Item getByIdOrNull(String id) {
        return syAttachGrpRepository.selectById(id).orElse(null);
    }

    /* 첨부파일 그룹 상세조회 */
    public SyAttachGrp findById(String id) {
        return syAttachGrpRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAttachGrp findByIdOrNull(String id) {
        return syAttachGrpRepository.findById(id).orElse(null);
    }

    /* 첨부파일 그룹 키검증 */
    public boolean existsById(String id) {
        return syAttachGrpRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syAttachGrpRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 첨부파일 그룹 목록조회 */
    public List<SyAttachGrpDto.Item> getList(SyAttachGrpDto.Request req) {
        return syAttachGrpRepository.selectList(req);
    }

    /* 첨부파일 그룹 페이지조회 */
    public SyAttachGrpDto.PageResponse getPageData(SyAttachGrpDto.Request req) {
        PageHelper.addPaging(req);
        return syAttachGrpRepository.selectPageList(req);
    }

    /* 첨부파일 그룹 등록 */
    @Transactional
    public SyAttachGrp create(SyAttachGrp body) {
        body.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 첨부파일 그룹 저장 */
    @Transactional
    public SyAttachGrp save(SyAttachGrp entity) {
        if (!existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 SyAttachGrp입니다: " + entity.getAttachGrpId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 첨부파일 그룹 수정 */
    @Transactional
    public SyAttachGrp update(String id, SyAttachGrp body) {
        SyAttachGrp entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "attachGrpId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAttachGrp saved = syAttachGrpRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 첨부파일 그룹 수정 */
    @Transactional
    public SyAttachGrp updateSelective(SyAttachGrp entity) {
        if (entity.getAttachGrpId() == null) throw new CmBizException("attachGrpId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAttachGrpId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAttachGrpId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAttachGrpRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 첨부파일 그룹 삭제 */
    @Transactional
    public void delete(String id) {
        SyAttachGrp entity = findById(id);
        syAttachGrpRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 첨부파일 그룹 목록저장 */
    @Transactional
    public void saveList(List<SyAttachGrp> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAttachGrpId() != null)
            .map(SyAttachGrp::getAttachGrpId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAttachGrpRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyAttachGrp> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAttachGrpId() != null)
            .toList();
        for (SyAttachGrp row : updateRows) {
            SyAttachGrp entity = findById(row.getAttachGrpId());
            VoUtil.voCopyExclude(row, entity, "attachGrpId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAttachGrpRepository.save(entity);
        }
        em.flush();

        List<SyAttachGrp> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAttachGrp row : insertRows) {
            row.setAttachGrpId(CmUtil.generateId("sy_attach_grp"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syAttachGrpRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
