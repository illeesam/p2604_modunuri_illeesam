package com.shopjoy.ecadminapi.base.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmEventDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
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
public class PmEventService {

    private final PmEventRepository pmEventRepository;

    @PersistenceContext
    private EntityManager em;

    /* 이벤트 키조회 */
    public PmEventDto.Item getById(String id) {
        PmEventDto.Item dto = pmEventRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEventDto.Item getByIdOrNull(String id) {
        return pmEventRepository.selectById(id).orElse(null);
    }

    /* 이벤트 상세조회 */
    public PmEvent findById(String id) {
        return pmEventRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public PmEvent findByIdOrNull(String id) {
        return pmEventRepository.findById(id).orElse(null);
    }

    /* 이벤트 키검증 */
    public boolean existsById(String id) {
        return pmEventRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!pmEventRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 이벤트 목록조회 */
    public List<PmEventDto.Item> getList(PmEventDto.Request req) {
        return pmEventRepository.selectList(req);
    }

    /* 이벤트 페이지조회 */
    public PmEventDto.PageResponse getPageData(PmEventDto.Request req) {
        PageHelper.addPaging(req);
        return pmEventRepository.selectPageData(req);
    }

    /* 이벤트 등록 */
    @Transactional
    public PmEvent create(PmEvent body) {
        body.setEventId(CmUtil.generateId("pm_event"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 이벤트 수정 */
    @Transactional
    public PmEvent update(String id, PmEvent body) {
        CmUtil.requireId(id, "id", this);
        PmEvent entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "eventId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        PmEvent saved = pmEventRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 이벤트 수정 */
    @Transactional
    public PmEvent updateSelective(PmEvent entity) {
        if (entity.getEventId() == null) throw new CmBizException("eventId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getEventId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getEventId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = pmEventRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 이벤트 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        PmEvent entity = findById(id);
        pmEventRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public PmEvent save(String cmd, PmEvent entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getEventId() == null || entity.getEventId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getEventId() == null)
                    throw new CmBizException("삭제 대상 eventId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!pmEventRepository.existsById(entity.getEventId()))
                    throw new CmBizException("존재하지 않는 PmEvent입니다: " + entity.getEventId() + "::" + CmUtil.svcCallerInfo(this));
                pmEventRepository.deleteById(entity.getEventId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setEventId(CmUtil.generateId("pm_event"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                PmEvent saved = pmEventRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getEventId() == null)
                    throw new CmBizException("수정 대상 eventId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = pmEventRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 PmEvent입니다: " + entity.getEventId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getEventId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<PmEvent> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (PmEvent row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getEventId() == null || row.getEventId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, PmEvent::getEventId, "U", "eventId", this);
            CmUtil.requireRowIds(rows, PmEvent::getEventId, "D", "eventId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(PmEvent::getEventId)
                .toList();
            if (!deleteIds.isEmpty()) {
                pmEventRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<PmEvent> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (PmEvent row : updateRows) {
                row.setUpdBy(authId);
                int affected = pmEventRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getEventId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<PmEvent> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (PmEvent row : insertRows) {
                row.setEventId(CmUtil.generateId("pm_event"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                pmEventRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
