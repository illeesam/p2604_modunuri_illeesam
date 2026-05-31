package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OdClaimService {

    private final OdClaimRepository odClaimRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임(취소/반품/교환) 키조회 */
    public OdClaimDto.Item getById(String id) {
        OdClaimDto.Item dto = odClaimRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdClaimDto.Item getByIdOrNull(String id) {
        return odClaimRepository.selectById(id).orElse(null);
    }

    /* 클레임(취소/반품/교환) 상세조회 */
    public OdClaim findById(String id) {
        return odClaimRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdClaim findByIdOrNull(String id) {
        return odClaimRepository.findById(id).orElse(null);
    }

    /* 클레임(취소/반품/교환) 키검증 */
    public boolean existsById(String id) {
        return odClaimRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odClaimRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임(취소/반품/교환) 목록조회 */
    public List<OdClaimDto.Item> getList(OdClaimDto.Request req) {
        return odClaimRepository.selectList(req);
    }

    /* 클레임(취소/반품/교환) 페이지조회 */
    public OdClaimDto.PageResponse getPageData(OdClaimDto.Request req) {
        PageHelper.addPaging(req);
        return odClaimRepository.selectPageData(req);
    }

    /* 클레임(취소/반품/교환) 등록 */
    @Transactional
    public OdClaim create(OdClaim body) {
        body.setClaimId(CmUtil.generateId("od_claim"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 클레임(취소/반품/교환) 수정 */
    @Transactional
    public OdClaim update(String id, OdClaim body) {
        CmUtil.requireId(id, "id", this);
        OdClaim entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdClaim saved = odClaimRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임(취소/반품/교환) 수정 */
    @Transactional
    public OdClaim updateSelective(OdClaim entity) {
        if (entity.getClaimId() == null) throw new CmBizException("claimId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odClaimRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 클레임(취소/반품/교환) 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdClaim entity = findById(id);
        odClaimRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdClaim save(String cmd, OdClaim entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getClaimId() == null || entity.getClaimId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getClaimId() == null)
                    throw new CmBizException("삭제 대상 claimId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odClaimRepository.existsById(entity.getClaimId()))
                    throw new CmBizException("존재하지 않는 OdClaim입니다: " + entity.getClaimId() + "::" + CmUtil.svcCallerInfo(this));
                odClaimRepository.deleteById(entity.getClaimId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setClaimId(CmUtil.generateId("od_claim"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdClaim saved = odClaimRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getClaimId() == null)
                    throw new CmBizException("수정 대상 claimId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odClaimRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdClaim입니다: " + entity.getClaimId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getClaimId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdClaim> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdClaim row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getClaimId() == null || row.getClaimId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdClaim::getClaimId, "U", "claimId", this);
            CmUtil.requireRowIds(rows, OdClaim::getClaimId, "D", "claimId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdClaim::getClaimId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odClaimRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdClaim> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdClaim row : updateRows) {
                row.setUpdBy(authId);
                int affected = odClaimRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getClaimId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdClaim> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdClaim row : insertRows) {
                row.setClaimId(CmUtil.generateId("od_claim"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odClaimRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
