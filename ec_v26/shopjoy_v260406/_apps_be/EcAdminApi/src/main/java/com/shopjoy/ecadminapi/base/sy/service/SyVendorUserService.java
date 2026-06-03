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
        return syVendorUserRepository.selectPageData(req);
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

    

    /* 업체 사용자 수정 */
    @Transactional
    public SyVendorUser update(String id, SyVendorUser body) {
        CmUtil.requireId(id, "id", this);
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
        CmUtil.requireId(id, "id", this);
        SyVendorUser entity = findById(id);
        syVendorUserRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendorUser saveOneBase(SyVendorUser entity) {
        String rowStatus  = entity.getRowStatus();
        String authId     = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
        if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
            rowStatus = (entity.getVendorUserId() == null || entity.getVendorUserId().isBlank()) ? "I" : "U";
        }

        if ("D".equals(rowStatus)) {
            if (entity.getVendorUserId() == null)
                throw new CmBizException("삭제 대상 vendorUserId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            if (!syVendorUserRepository.existsById(entity.getVendorUserId()))
                throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId() + "::" + CmUtil.svcCallerInfo(this));
            syVendorUserRepository.deleteById(entity.getVendorUserId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            SyVendorUser saved = syVendorUserRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getVendorUserId() == null)
                throw new CmBizException("수정 대상 vendorUserId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = syVendorUserRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 SyVendorUser입니다: " + entity.getVendorUserId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getVendorUserId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<SyVendorUser> rows) {
        /* 0단계: rowStatus 정규화 */
        for (SyVendorUser row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getVendorUserId() == null || row.getVendorUserId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, SyVendorUser::getVendorUserId, "U", "vendorUserId", this);
        CmUtil.requireRowIds(rows, SyVendorUser::getVendorUserId, "D", "vendorUserId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(SyVendorUser::getVendorUserId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syVendorUserRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<SyVendorUser> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (SyVendorUser row : updateRows) {
            row.setUpdBy(authId);
            int affected = syVendorUserRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorUserId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<SyVendorUser> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyVendorUser row : insertRows) {
            row.setVendorUserId(CmUtil.generateId("sy_vendor_user"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            syVendorUserRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
