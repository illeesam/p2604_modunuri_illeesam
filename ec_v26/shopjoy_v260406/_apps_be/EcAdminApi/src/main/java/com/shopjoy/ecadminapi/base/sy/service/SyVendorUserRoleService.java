package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorUserRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorUserRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyVendorUserRoleRepository;
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
public class SyVendorUserRoleService {

    private final SyVendorUserRoleRepository syVendorUserRoleRepository;

    @PersistenceContext
    private EntityManager em;

    /* 업체 사용자 역할 연결 키조회 */
    public SyVendorUserRoleDto.Item getById(String id) {
        SyVendorUserRoleDto.Item dto = syVendorUserRoleRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUserRoleDto.Item getByIdOrNull(String id) {
        return syVendorUserRoleRepository.selectById(id).orElse(null);
    }

    /* 업체 사용자 역할 연결 상세조회 */
    public SyVendorUserRole findById(String id) {
        return syVendorUserRoleRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyVendorUserRole findByIdOrNull(String id) {
        return syVendorUserRoleRepository.findById(id).orElse(null);
    }

    /* 업체 사용자 역할 연결 키검증 */
    public boolean existsById(String id) {
        return syVendorUserRoleRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syVendorUserRoleRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 업체 사용자 역할 연결 목록조회 */
    public List<SyVendorUserRoleDto.Item> getList(SyVendorUserRoleDto.Request req) {
        return syVendorUserRoleRepository.selectList(req);
    }

    /* 업체 사용자 역할 연결 페이지조회 */
    public SyVendorUserRoleDto.PageResponse getPageData(SyVendorUserRoleDto.Request req) {
        PageHelper.addPaging(req);
        return syVendorUserRoleRepository.selectPageData(req);
    }

    /* 업체 사용자 역할 연결 등록 */
    @Transactional
    public SyVendorUserRole create(SyVendorUserRole body) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        body.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
        body.setGrantUserId(authId);
        body.setGrantDate(now);
        body.setRegBy(authId);
        body.setRegDate(now);
        SyVendorUserRole saved = syVendorUserRoleRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 업체 사용자 역할 연결 수정 */
    @Transactional
    public SyVendorUserRole update(String id, SyVendorUserRole body) {
        CmUtil.requireId(id, "id", this);
        SyVendorUserRole entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "vendorUserRoleId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyVendorUserRole saved = syVendorUserRoleRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 업체 사용자 역할 연결 수정 */
    @Transactional
    public SyVendorUserRole updateSelective(SyVendorUserRole entity) {
        if (entity.getVendorUserRoleId() == null) throw new CmBizException("vendorUserRoleId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getVendorUserRoleId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syVendorUserRoleRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 업체 사용자 역할 연결 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyVendorUserRole entity = findById(id);
        syVendorUserRoleRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyVendorUserRole save(String cmd, SyVendorUserRole entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getVendorUserRoleId() == null || entity.getVendorUserRoleId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getVendorUserRoleId() == null)
                    throw new CmBizException("삭제 대상 vendorUserRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syVendorUserRoleRepository.existsById(entity.getVendorUserRoleId()))
                    throw new CmBizException("존재하지 않는 SyVendorUserRole입니다: " + entity.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
                syVendorUserRoleRepository.deleteById(entity.getVendorUserRoleId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyVendorUserRole saved = syVendorUserRoleRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getVendorUserRoleId() == null)
                    throw new CmBizException("수정 대상 vendorUserRoleId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syVendorUserRoleRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyVendorUserRole입니다: " + entity.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getVendorUserRoleId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<SyVendorUserRole> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (SyVendorUserRole row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getVendorUserRoleId() == null || row.getVendorUserRoleId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, SyVendorUserRole::getVendorUserRoleId, "U", "vendorUserRoleId", this);
            CmUtil.requireRowIds(rows, SyVendorUserRole::getVendorUserRoleId, "D", "vendorUserRoleId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(SyVendorUserRole::getVendorUserRoleId)
                .toList();
            if (!deleteIds.isEmpty()) {
                syVendorUserRoleRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<SyVendorUserRole> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (SyVendorUserRole row : updateRows) {
                row.setUpdBy(authId);
                int affected = syVendorUserRoleRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getVendorUserRoleId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<SyVendorUserRole> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (SyVendorUserRole row : insertRows) {
                row.setVendorUserRoleId(CmUtil.generateId("sy_vendor_user_role"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                syVendorUserRoleRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
