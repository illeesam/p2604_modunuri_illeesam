package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmhPushLogDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmhPushLog;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmhPushLogRepository;
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
public class CmhPushLogService {

    private final CmhPushLogRepository cmhPushLogRepository;

    @PersistenceContext
    private EntityManager em;

    /* 푸시 발송 이력 키조회 */
    public CmhPushLogDto.Item getById(String id) {
        CmhPushLogDto.Item dto = cmhPushLogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmhPushLogDto.Item getByIdOrNull(String id) {
        return cmhPushLogRepository.selectById(id).orElse(null);
    }

    /* 푸시 발송 이력 상세조회 */
    public CmhPushLog findById(String id) {
        return cmhPushLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmhPushLog findByIdOrNull(String id) {
        return cmhPushLogRepository.findById(id).orElse(null);
    }

    /* 푸시 발송 이력 키검증 */
    public boolean existsById(String id) {
        return cmhPushLogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmhPushLogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 푸시 발송 이력 목록조회 */
    public List<CmhPushLogDto.Item> getList(CmhPushLogDto.Request req) {
        return cmhPushLogRepository.selectList(req);
    }

    /* 푸시 발송 이력 페이지조회 */
    public CmhPushLogDto.PageResponse getPageData(CmhPushLogDto.Request req) {
        PageHelper.addPaging(req);
        return cmhPushLogRepository.selectPageData(req);
    }

    /* 푸시 발송 이력 등록 */
    @Transactional
    public CmhPushLog create(CmhPushLog body) {
        body.setLogId(CmUtil.generateId("cmh_push_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmhPushLog saved = cmhPushLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 푸시 발송 이력 수정 */
    @Transactional
    public CmhPushLog update(String id, CmhPushLog body) {
        CmUtil.requireId(id, "id", this);
        CmhPushLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmhPushLog saved = cmhPushLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 푸시 발송 이력 수정 */
    @Transactional
    public CmhPushLog updateSelective(CmhPushLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmhPushLogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 푸시 발송 이력 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmhPushLog entity = findById(id);
        cmhPushLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** saveOneBase -- rowStatus(I/U/D/M) 단건 분기 처리. saveListBase의 단건 버전. */
    @Transactional
    public CmhPushLog saveOneBase(CmhPushLog entity) {
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
            if (!cmhPushLogRepository.existsById(entity.getLogId()))
                throw new CmBizException("존재하지 않는 CmhPushLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
            cmhPushLogRepository.deleteById(entity.getLogId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setLogId(CmUtil.generateId("cmh_push_log"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            CmhPushLog saved = cmhPushLogRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getLogId() == null)
                throw new CmBizException("수정 대상 logId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = cmhPushLogRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 CmhPushLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getLogId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveListBase -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별). */
    @Transactional
    public void saveListBase(List<CmhPushLog> rows) {
        /* 0단계: rowStatus 정규화 */
        for (CmhPushLog row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getLogId() == null || row.getLogId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, CmhPushLog::getLogId, "U", "logId", this);
        CmUtil.requireRowIds(rows, CmhPushLog::getLogId, "D", "logId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(CmhPushLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmhPushLogRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<CmhPushLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (CmhPushLog row : updateRows) {
            row.setUpdBy(authId);
            int affected = cmhPushLogRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<CmhPushLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmhPushLog row : insertRows) {
            row.setLogId(CmUtil.generateId("cmh_push_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmhPushLogRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
    }
}
