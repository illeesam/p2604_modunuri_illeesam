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

    

    /* 업체별 브랜드 수정 */
    @Transactional
    public SyVendorBrand update(String id, SyVendorBrand body) {
        CmUtil.requireId(id, "id", this);
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
        CmUtil.requireId(id, "id", this);
        SyVendorBrand entity = findById(id);
        syVendorBrandRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendorBrand save(String cmd, SyVendorBrand entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVendorBrandId() == null || entity.getVendorBrandId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVendorBrandId() == null)
                    throw new CmBizException("삭제 대상 vendorBrandId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syVendorBrandRepository.existsById(entity.getVendorBrandId()))
                    throw new CmBizException("존재하지 않는 SyVendorBrand입니다: " + entity.getVendorBrandId() + "::" + CmUtil.svcCallerInfo(this));
                syVendorBrandRepository.deleteById(entity.getVendorBrandId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVendorBrandId(CmUtil.generateId("sy_vendor_brand"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyVendorBrand saved = syVendorBrandRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVendorBrandId() == null)
                    throw new CmBizException("수정 대상 vendorBrandId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syVendorBrandRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyVendorBrand입니다: " + entity.getVendorBrandId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVendorBrandId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyVendorBrand> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyVendorBrand row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getVendorBrandId() == null || row.getVendorBrandId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyVendorBrand::getVendorBrandId, "U", "vendorBrandId", this);
            CmUtil.requireRowIds(rows, SyVendorBrand::getVendorBrandId, "D", "vendorBrandId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyVendorBrand::getVendorBrandId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syVendorBrandRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyVendorBrand> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyVendorBrand row : updateRows) {
                row.setUpdBy(authId);
                int affected = syVendorBrandRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorBrandId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyVendorBrand> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyVendorBrand row : insertRows) {
                row.setVendorBrandId(CmUtil.generateId("sy_vendor_brand"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorBrandRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
