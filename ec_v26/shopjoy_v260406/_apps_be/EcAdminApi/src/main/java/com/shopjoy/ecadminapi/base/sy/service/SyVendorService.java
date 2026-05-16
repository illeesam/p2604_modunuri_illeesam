package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorRepository;
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
public class SyVendorService {

    private final SyVendorRepository syVendorRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체(판매자) 키조회 */
    public SyVendorDto.Item getById(String id) {
        SyVendorDto.Item dto = syVendorRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorDto.Item getByIdOrNull(String id) {
        return syVendorRepository.selectById(id).orElse(null);
    }

    /* 업체(판매자) 상세조회 */
    public SyVendor findById(String id) {
        return syVendorRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendor findByIdOrNull(String id) {
        return syVendorRepository.findById(id).orElse(null);
    }

    /* 업체(판매자) 키검증 */
    public boolean existsById(String id) {
        return syVendorRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체(판매자) 목록조회 */
    public List<SyVendorDto.Item> getList(SyVendorDto.Request req) {
        return syVendorRepository.selectList(req);
    }

    /* 업체(판매자) 페이지조회 */
    public SyVendorDto.PageResponse getPageData(SyVendorDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorRepository.selectPageList(req);
    }

    /* 업체(판매자) 등록 */
    @Transactional
    public SyVendor create(SyVendor body) {
        body.setVendorId(CmUtil.generateId("sy_vendor"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVendor saved = syVendorRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체(판매자) 저장 */
    @Transactional
    public SyVendor save(SyVendor entity) {
        if (!existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 SyVendor입니다: " + entity.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendor saved = syVendorRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체(판매자) 수정 */
    @Transactional
    public SyVendor update(String id, SyVendor body) {
        SyVendor entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendor saved = syVendorRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체(판매자) 수정 */
    @Transactional
    public SyVendor updateSelective(SyVendor entity) {
        if (entity.getVendorId() == null) throw new CmBizException("vendorId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체(판매자) 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendor entity = findById(id);
        syVendorRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 업체(판매자) 목록저장 */
    @Transactional
    public void saveList(List<SyVendor> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorId() != null)
            .map(SyVendor::getVendorId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVendor> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorId() != null)
            .toList();
        for (SyVendor row : updateRows) {
            SyVendor entity = findById(row.getVendorId());
            VoUtil.voCopyExclude(row, entity, "vendorId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorRepository.save(entity);
        }
        em.flush();

        List<SyVendor> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendor row : insertRows) {
            row.setVendorId(CmUtil.generateId("sy_vendor"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
