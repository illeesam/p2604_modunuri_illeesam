package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUser;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRepository;
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
public class SyVendorUserService {

    private final SyVendorUserRepository syVendorUserRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체 사용자 키조회 */
    public SyVendorUserDto.Item getById(String id) {
        SyVendorUserDto.Item dto = syVendorUserRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUserDto.Item getByIdOrNull(String id) {
        return syVendorUserRepository.selectById(id).orElse(null);
    }

    /* 업체 사용자 상세조회 */
    public SyVendorUser findById(String id) {
        return syVendorUserRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUser findByIdOrNull(String id) {
        return syVendorUserRepository.findById(id).orElse(null);
    }

    /* 업체 사용자 키검증 */
    public boolean existsById(String id) {
        return syVendorUserRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorUserRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체 사용자 목록조회 */
    public List<SyVendorUserDto.Item> getList(SyVendorUserDto.Request req) {
        return syVendorUserRepository.selectList(req);
    }

    /* 업체 사용자 페이지조회 */
    public SyVendorUserDto.PageResponse getPageData(SyVendorUserDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorUserRepository.selectPageList(req);
    }

    /* 업체 사용자 등록 */
    @Transactional
    public SyVendorUser create(SyVendorUser body) {
        body.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체 사용자 저장 */
    @Transactional
    public SyVendorUser save(SyVendorUser entity) {
        if (!existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체 사용자 수정 */
    @Transactional
    public SyVendorUser update(String id, SyVendorUser body) {
        SyVendorUser entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorUserId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUser saved = syVendorUserRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체 사용자 수정 */
    @Transactional
    public SyVendorUser updateSelective(SyVendorUser entity) {
        if (entity.getVendorUserId() == null) throw new CmBizException("vendorUserId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorUserId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorUserId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorUserRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체 사용자 삭제 */
    @Transactional
    public void delete(String id) {
        SyVendorUser entity = findById(id);
        syVendorUserRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /* 업체 사용자 목록저장 */
    @Transactional
    public void saveList(List<SyVendorUser> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getVendorUserId() != null)
            .map(SyVendorUser::getVendorUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorUserRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<SyVendorUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getVendorUserId() != null)
            .toList();
        for (SyVendorUser row : updateRows) {
            SyVendorUser entity = findById(row.getVendorUserId());
            VoUtil.voCopyExclude(row, entity, "vendorUserId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syVendorUserRepository.save(entity);
        }
        em.flush();

        List<SyVendorUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorUser row : insertRows) {
            row.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorUserRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
