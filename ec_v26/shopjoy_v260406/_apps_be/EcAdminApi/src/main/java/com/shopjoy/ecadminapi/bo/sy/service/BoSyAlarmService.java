package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.service.SyAlarmService;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import com.shopjoy.ecadminapi.base.sy.repository.SyAlarmRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;


/**
 * BO 알람 서비스 — base SyAlarmService 위임 + saveList(List<SyAlarm>) 보존.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyAlarmService {

    private final SyAlarmService syAlarmService;
    private final SyAlarmRepository syAlarmRepository;
    @PersistenceContext
    private EntityManager em;

    /* 키조회 */
    public SyAlarmDto.Item getById(String id) { return syAlarmService.getById(id); }
    /* 목록조회 */
    public List<SyAlarmDto.Item> getList(SyAlarmDto.Request req) { return syAlarmService.getList(req); }
    /* 페이지조회 */
    public SyAlarmDto.PageResponse getPageData(SyAlarmDto.Request req) { return syAlarmService.getPageData(req); }

    @Transactional public SyAlarm create(SyAlarm body) { return syAlarmService.create(body); }
    @Transactional public SyAlarm update(String id, SyAlarm body) { return syAlarmService.update(id, body); }
    @Transactional public void delete(String id) { syAlarmService.delete(id); }

    /** saveList — DELETE / UPDATE / INSERT 단계별 일괄 저장 */
    @Transactional
    public void saveList(List<SyAlarm> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getAlarmId() != null)
            .map(SyAlarm::getAlarmId)
            .toList();
        if (!deleteIds.isEmpty()) {
            syAlarmRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }

        List<SyAlarm> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getAlarmId() != null)
            .toList();
        for (SyAlarm row : updateRows) {
            SyAlarm entity = syAlarmService.findById(row.getAlarmId());
            VoUtil.voCopyExclude(row, entity, "alarmId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            syAlarmRepository.save(entity);
        }
        em.flush();

        List<SyAlarm> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (SyAlarm row : insertRows) {
            syAlarmService.create(row);
        }
        em.flush();
        em.clear();
    }
}
