package com.shopjoy.ecadminapi.base.ec.mb.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.dto.MbhMemberTokenLogDto;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbhMemberTokenLogRepository;
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
public class MbhMemberTokenLogService {

    private final MbhMemberTokenLogRepository mbhMemberTokenLogRepository;

    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public MbhMemberTokenLogDto.Item getById(String id) {
        MbhMemberTokenLogDto.Item dto = mbhMemberTokenLogRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbhMemberTokenLogDto.Item getByIdOrNull(String id) {
        return mbhMemberTokenLogRepository.selectById(id).orElse(null);
    }

    /* 상세조회 */
    public MbhMemberTokenLog findById(String id) {
        return mbhMemberTokenLogRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public MbhMemberTokenLog findByIdOrNull(String id) {
        return mbhMemberTokenLogRepository.findById(id).orElse(null);
    }

    /* 키검증 */
    public boolean existsById(String id) {
        return mbhMemberTokenLogRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!mbhMemberTokenLogRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 목록조회 */
    public List<MbhMemberTokenLogDto.Item> getList(MbhMemberTokenLogDto.Request req) {
        return mbhMemberTokenLogRepository.selectList(req);
    }

    /* 페이지조회 */
    public MbhMemberTokenLogDto.PageResponse getPageData(MbhMemberTokenLogDto.Request req) {
        PageHelper.addPaging(req);
        return mbhMemberTokenLogRepository.selectPageData(req);
    }

    /* 등록 */
    @Transactional
    public MbhMemberTokenLog create(MbhMemberTokenLog body) {
        body.setLogId(CmUtil.generateId("mbh_member_token_log"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 수정 */
    @Transactional
    public MbhMemberTokenLog update(String id, MbhMemberTokenLog body) {
        CmUtil.requireId(id, "id", this);
        MbhMemberTokenLog entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "logId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 수정 */
    @Transactional
    public MbhMemberTokenLog updateSelective(MbhMemberTokenLog entity) {
        if (entity.getLogId() == null) throw new CmBizException("logId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getLogId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = mbhMemberTokenLogRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        MbhMemberTokenLog entity = findById(id);
        mbhMemberTokenLogRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public MbhMemberTokenLog saveOneBase(MbhMemberTokenLog entity) {
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
            if (!mbhMemberTokenLogRepository.existsById(entity.getLogId()))
                throw new CmBizException("존재하지 않는 MbhMemberTokenLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
            mbhMemberTokenLogRepository.deleteById(entity.getLogId());
            return null;
        } else if ("I".equals(rowStatus)) {
            entity.setLogId(CmUtil.generateId("mbh_member_token_log"));
            entity.setRegBy(authId); entity.setRegDate(now);
            entity.setUpdBy(authId); entity.setUpdDate(now);
            MbhMemberTokenLog saved = mbhMemberTokenLogRepository.save(entity);
            if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
            return saved;
        } else if ("U".equals(rowStatus)) {
            if (entity.getLogId() == null)
                throw new CmBizException("수정 대상 logId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
            entity.setUpdBy(authId);
            int affected = mbhMemberTokenLogRepository.updateSelective(entity);
            if (affected == 0)
                throw new CmBizException("존재하지 않는 MbhMemberTokenLog입니다: " + entity.getLogId() + "::" + CmUtil.svcCallerInfo(this));
            em.clear();
            return findById(entity.getLogId());
        }
        throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));

    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveListBase(List<MbhMemberTokenLog> rows) {
        /* 0단계: rowStatus 정규화 */
        for (MbhMemberTokenLog row : rows) {
            String rs = row.getRowStatus();
            if ("M".equals(rs) || rs == null || rs.isBlank()) {
                row.setRowStatus((row.getLogId() == null || row.getLogId().isBlank()) ? "I" : "U");
            } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
            }
        }
        CmUtil.requireRowIds(rows, MbhMemberTokenLog::getLogId, "U", "logId", this);
        CmUtil.requireRowIds(rows, MbhMemberTokenLog::getLogId, "D", "logId", this);
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        // 1단계: DELETE 일괄
        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()))
            .map(MbhMemberTokenLog::getLogId)
            .toList();
        if (!deleteIds.isEmpty()) {
            mbhMemberTokenLogRepository.deleteAllById(deleteIds);
        }

        // 2단계: UPDATE - updateSelective
        List<MbhMemberTokenLog> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()))
            .toList();
        for (MbhMemberTokenLog row : updateRows) {
            row.setUpdBy(authId);
            int affected = mbhMemberTokenLogRepository.updateSelective(row);
            if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getLogId() + "::" + CmUtil.svcCallerInfo(this));
        }

        // 3단계: INSERT
        List<MbhMemberTokenLog> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (MbhMemberTokenLog row : insertRows) {
            row.setLogId(CmUtil.generateId("mbh_member_token_log"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            mbhMemberTokenLogRepository.save(row);
        }

        // 4단계: 영속성 컨텍스트 동기화
        em.flush();
        em.clear();
        return;

    }
}
