package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorBrandDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorBrand;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorBrandRepository;
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
public class SyVendorBrandService {

    private final SyVendorBrandRepository syVendorBrandRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체별 브랜드 키조회 */
    public SyVendorBrandDto.Item getById(String id) {
        SyVendorBrandDto.Item dto = syVendorBrandRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorBrandDto.Item getByIdOrNull(String id) {
        return syVendorBrandRepository.selectById(id).orElse(null);
    }

    /* 업체별 브랜드 상세조회 */
    public SyVendorBrand findById(String id) {
        return syVendorBrandRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorBrand findByIdOrNull(String id) {
        return syVendorBrandRepository.findById(id).orElse(null);
    }

    /* 업체별 브랜드 키검증 */
    public boolean existsById(String id) {
        return syVendorBrandRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorBrandRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체별 브랜드 목록조회 */
    public List<SyVendorBrandDto.Item> getList(SyVendorBrandDto.Request req) {
        return syVendorBrandRepository.selectList(req);
    }

    /* 업체별 브랜드 페이지조회 */
    public SyVendorBrandDto.PageResponse getPageData(SyVendorBrandDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorBrandRepository.selectPageList(req);
    }

    /* 업체별 브랜드 등록 */
    @Transactional
    public SyVendorBrand create(SyVendorBrand body) {
        body.setVendorBrandId(CmUtil.generateId("sy_vendor_brand"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVendorBrand saved = syVendorBrandRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체별 브랜드 저장 */
    @Transactional
    public SyVendorBrand save(SyVendorBrand entity) {
        if (!existsById(entity.getVendorBrandId()))
            throw new CmBizException("존재하지 않는 SyVendorBrand입니다: " + entity.getVendorBrandId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorBrand saved = syVendorBrandRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체별 브랜드 수정 */
    @Transactional
    public SyVendorBrand update(String id, SyVendorBrand body) {
        SyVendorBrand entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorBrandId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorBrand saved = syVendorBrandRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체별 브랜드 수정 */
    @Transactional
    public SyVendorBrand updateSelective(SyVendorBrand entity) {
        if (entity.getVendorBrandId() == null) throw new CmBizException("vendorBrandId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorBrandId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorBrandId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorBrandRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체별 브랜드 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendorBrand entity = findById(id);
        syVendorBrandRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 업체별 브랜드 목록저장 */
    @Transactional
    public void saveList(List<SyVendorBrand> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorBrandId() != null)
            .map(SyVendorBrand::getVendorBrandId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorBrandRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVendorBrand> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorBrandId() != null)
            .toList();
        for (SyVendorBrand row : updateRows) {
            SyVendorBrand entity = findById(row.getVendorBrandId());
            VoUtil.voCopyExclude(row, entity, "vendorBrandId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorBrandRepository.save(entity);
        }
        em.flush();

        List<SyVendorBrand> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorBrand row : insertRows) {
            row.setVendorBrandId(CmUtil.generateId("sy_vendor_brand"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorBrandRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
