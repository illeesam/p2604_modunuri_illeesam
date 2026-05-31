package com.shopjoy.ecadminapi.base.ec.pd.service;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdhProdViewLog;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdhProdViewLogRepository;
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
public class PdhProdViewLogService {

    private final PdhProdViewLogRepository pdhProdViewLogRepository;

    @PersistenceContext
    private EntityManager em;

    /* 상품 조회 로그 키조회 */
    public PdhProdViewLogDto.Item getById(String id) {
        PdhProdViewLogDto.Item dto = pdhProdViewLogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdViewLogDto.Item getByIdOrNull(String id) {
        return pdhProdViewLogRepository.selectById(id).orElse(null);
    }

    /* 상품 조회 로그 상세조회 */
    public PdhProdViewLog findById(String id) {
        return pdhProdViewLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PdhProdViewLog findByIdOrNull(String id) {
        return pdhProdViewLogRepository.findById(id).orElse(null);
    }

    /* 상품 조회 로그 키검증 */
    public boolean existsById(String id) {
        return pdhProdViewLogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pdhProdViewLogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 상품 조회 로그 목록조회 */
    public List<PdhProdViewLogDto.Item> getList(PdhProdViewLogDto.Request req) {
        return pdhProdViewLogRepository.selectList(req);
    }

    /* 상품 조회 로그 페이지조회 */
    public PdhProdViewLogDto.PageResponse getPageData(PdhProdViewLogDto.Request req) {
        PageHelper.addPaging(req);
        return pdhProdViewLogRepository.selectPageData(req);
    }

    /* 상품 조회 로그 등록 */
    @Transactional
    public PdhProdViewLog create(PdhProdViewLog body) {
        body.setLogId(CmUtil.generateId("pdh_prod_view_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PdhProdViewLog saved = pdhProdViewLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 상품 조회 로그 수정 */
    @Transactional
    public PdhProdViewLog update(String id, PdhProdViewLog body) {
        CmUtil.requireId(id, "id", this);
        PdhProdViewLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PdhProdViewLog saved = pdhProdViewLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 상품 조회 로그 수정 */
    @Transactional
    public PdhProdViewLog updateSelective(PdhProdViewLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pdhProdViewLogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 상품 조회 로그 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PdhProdViewLog entity = findById(id);
        pdhProdViewLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PdhProdViewLog save(String cmd, PdhProdViewLog entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getLogId() == null || entity.getLogId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getLogId() == null)
                    throw new CmBizException("삭제 대상 logId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pdhProdViewLogRepository.existsById(entity.getLogId()))
                    throw new CmBizException("존재하지 않는 PdhProdViewLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
                pdhProdViewLogRepository.deleteById(entity.getLogId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setLogId(CmUtil.generateId("pdh_prod_view_log"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PdhProdViewLog saved = pdhProdViewLogRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getLogId() == null)
                    throw new CmBizException("수정 대상 logId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pdhProdViewLogRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PdhProdViewLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getLogId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PdhProdViewLog> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PdhProdViewLog row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getLogId() == null || row.getLogId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PdhProdViewLog::getLogId, "U", "logId", this);
            CmUtil.requireRowIds(rows, PdhProdViewLog::getLogId, "D", "logId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PdhProdViewLog::getLogId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pdhProdViewLogRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PdhProdViewLog> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PdhProdViewLog row : updateRows) {
                row.setUpdBy(authId);
                int affected = pdhProdViewLogRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getLogId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PdhProdViewLog> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PdhProdViewLog row : insertRows) {
                row.setLogId(CmUtil.generateId("pdh_prod_view_log"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pdhProdViewLogRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
