package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
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
public class SyAlarmService {

    private final SyAlarmRepository syAlarmRepository;
    @PersistenceContext
    private EntityManager em;

    /* 알람 키조회 */
    public SyAlarmDto.Item getById(String id) {
        SyAlarmDto.Item dto = syAlarmRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAlarmDto.Item getByIdOrNull(String id) {
        return syAlarmRepository.selectById(id).orElse(null);
    }

    /* 알람 상세조회 */
    public SyAlarm findById(String id) {
        return syAlarmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public SyAlarm findByIdOrNull(String id) {
        return syAlarmRepository.findById(id).orElse(null);
    }

    /* 알람 키검증 */
    public boolean existsById(String id) {
        return syAlarmRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!syAlarmRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 알람 목록조회 */
    public List<SyAlarmDto.Item> getList(SyAlarmDto.Request req) {
        return syAlarmRepository.selectList(req);
    }

    /* 알람 페이지조회 */
    public SyAlarmDto.PageResponse getPageData(SyAlarmDto.Request req) {
        PageHelper.addPaging(req);
        return syAlarmRepository.selectPageList(req);
    }

    /* 알람 등록 */
    @Transactional
    public SyAlarm create(SyAlarm body) {
        body.setAlarmId(CmUtil.generateId("sy_alarm"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 알람 수정 */
    @Transactional
    public SyAlarm update(String id, SyAlarm body) {
        CmUtil.requireId(id, "id", this);
        SyAlarm entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "alarmId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 알람 수정 */
    @Transactional
    public SyAlarm updateSelective(SyAlarm entity) {
        if (entity.getAlarmId() == null) throw new CmBizException("alarmId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getAlarmId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAlarmId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAlarmRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 알람 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        SyAlarm entity = findById(id);
        syAlarmRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public SyAlarm save(String cmd, SyAlarm entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getAlarmId() == null || entity.getAlarmId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getAlarmId() == null)
                    throw new CmBizException("삭제 대상 alarmId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!syAlarmRepository.existsById(entity.getAlarmId()))
                    throw new CmBizException("존재하지 않는 SyAlarm입니다: " + entity.getAlarmId() + "::" + CmUtil.svcCallerInfo(this));
                syAlarmRepository.deleteById(entity.getAlarmId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setAlarmId(CmUtil.generateId("sy_alarm"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                SyAlarm saved = syAlarmRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getAlarmId() == null)
                    throw new CmBizException("수정 대상 alarmId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = syAlarmRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 SyAlarm입니다: " + entity.getAlarmId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getAlarmId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
        /** getPathTreeNodeCounts — 표시경로 노드별 SyAlarm 수 (검색조건 + 자손 누적, 트리 우측 뱃지용).
     *   검색조건이 있으면 그 조건에 부합하는 row 만 카운트.
     *   결과: { pathId: cnt, '__total__': 전체, '__orphan__': path 없음 } */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyAlarmDto.Request req) {
        return syAlarmRepository.selectPathTreeAlarmCnts(req);
    }

    private static String nullIfBlank(String s) {
        return (s == null || s.isBlank()) ? null : s;
    }



    /** searchType csv 를 ',a,b,' 형태로 감싸 SQL `LIKE '%,a,%'` 매칭 가능하게 변환 */
    private static String wrapCsv(String s) {
        if (s == null || s.isBlank()) return null;
        return "," + s.trim().replaceAll("\\s*,\\s*", ",") + ",";
    }
}
