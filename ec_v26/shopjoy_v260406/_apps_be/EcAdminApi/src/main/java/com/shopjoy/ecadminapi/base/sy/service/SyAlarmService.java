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

    /* 알람 저장 */
    @Transactional
    public SyAlarm save(SyAlarm entity) {
        if (!existsById(entity.getAlarmId()))
            throw new CmBizException("존재하지 않는 알람입니다: " + entity.getAlarmId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 알람 수정 */
    @Transactional
    public SyAlarm update(String id, SyAlarm body) {
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
        SyAlarm entity = findById(id);
        syAlarmRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }
}
