package com.shopjoy.ecadminapi.base.ec.od.service;

import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdhClaimStatusHistDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhClaimStatusHistRepository;
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
public class OdhClaimStatusHistService {

    private final OdhClaimStatusHistRepository odhClaimStatusHistRepository;

    @PersistenceContext
    private EntityManager em;

    /* 클레임 상태 이력 키조회 */
    public OdhClaimStatusHistDto.Item getById(String id) {
        OdhClaimStatusHistDto.Item dto = odhClaimStatusHistRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimStatusHistDto.Item getByIdOrNull(String id) {
        return odhClaimStatusHistRepository.selectById(id).orElse(null);
    }

    /* 클레임 상태 이력 상세조회 */
    public OdhClaimStatusHist findById(String id) {
        return odhClaimStatusHistRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public OdhClaimStatusHist findByIdOrNull(String id) {
        return odhClaimStatusHistRepository.findById(id).orElse(null);
    }

    /* 클레임 상태 이력 키검증 */
    public boolean existsById(String id) {
        return odhClaimStatusHistRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!odhClaimStatusHistRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 클레임 상태 이력 목록조회 */
    public List<OdhClaimStatusHistDto.Item> getList(OdhClaimStatusHistDto.Request req) {
        return odhClaimStatusHistRepository.selectList(req);
    }

    /* 클레임 상태 이력 페이지조회 */
    public OdhClaimStatusHistDto.PageResponse getPageData(OdhClaimStatusHistDto.Request req) {
        PageHelper.addPaging(req);
        return odhClaimStatusHistRepository.selectPageList(req);
    }

    /* 클레임 상태 이력 등록 */
    @Transactional
    public OdhClaimStatusHist create(OdhClaimStatusHist body) {
        body.setClaimStatusHistId(CmUtil.generateId("odh_claim_status_hist"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 클레임 상태 이력 수정 */
    @Transactional
    public OdhClaimStatusHist update(String id, OdhClaimStatusHist body) {
        CmUtil.requireId(id, "id", this);
        OdhClaimStatusHist entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "claimStatusHistId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 클레임 상태 이력 수정 */
    @Transactional
    public OdhClaimStatusHist updateSelective(OdhClaimStatusHist entity) {
        if (entity.getClaimStatusHistId() == null) throw new CmBizException("claimStatusHistId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getClaimStatusHistId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getClaimStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = odhClaimStatusHistRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 클레임 상태 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        OdhClaimStatusHist entity = findById(id);
        odhClaimStatusHistRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public OdhClaimStatusHist save(String cmd, OdhClaimStatusHist entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getClaimStatusHistId() == null || entity.getClaimStatusHistId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getClaimStatusHistId() == null)
                    throw new CmBizException("삭제 대상 claimStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!odhClaimStatusHistRepository.existsById(entity.getClaimStatusHistId()))
                    throw new CmBizException("존재하지 않는 OdhClaimStatusHist입니다: " + entity.getClaimStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
                odhClaimStatusHistRepository.deleteById(entity.getClaimStatusHistId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setClaimStatusHistId(CmUtil.generateId("odh_claim_status_hist"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                OdhClaimStatusHist saved = odhClaimStatusHistRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getClaimStatusHistId() == null)
                    throw new CmBizException("수정 대상 claimStatusHistId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = odhClaimStatusHistRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 OdhClaimStatusHist입니다: " + entity.getClaimStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getClaimStatusHistId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<OdhClaimStatusHist> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (OdhClaimStatusHist row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getClaimStatusHistId() == null || row.getClaimStatusHistId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, OdhClaimStatusHist::getClaimStatusHistId, "U", "claimStatusHistId", this);
            CmUtil.requireRowIds(rows, OdhClaimStatusHist::getClaimStatusHistId, "D", "claimStatusHistId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(OdhClaimStatusHist::getClaimStatusHistId)
                .toList();
            if (!deleteIds.isEmpty()) {
                odhClaimStatusHistRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<OdhClaimStatusHist> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (OdhClaimStatusHist row : updateRows) {
                row.setUpdBy(authId);
                int affected = odhClaimStatusHistRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getClaimStatusHistId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<OdhClaimStatusHist> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (OdhClaimStatusHist row : insertRows) {
                row.setClaimStatusHistId(CmUtil.generateId("odh_claim_status_hist"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                odhClaimStatusHistRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
