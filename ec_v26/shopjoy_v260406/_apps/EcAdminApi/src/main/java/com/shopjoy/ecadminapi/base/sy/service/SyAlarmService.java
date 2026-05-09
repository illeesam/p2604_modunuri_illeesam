package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyAlarmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAlarm;
import com.shopjoy.ecadminapi.base.sy.data.vo.SyAlarmReq;
import com.shopjoy.ecadminapi.base.sy.mapper.SyAlarmMapper;
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
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyAlarmService {

    private final SyAlarmMapper syAlarmMapper;
    private final SyAlarmRepository syAlarmRepository;
    @PersistenceContext
    private EntityManager em;

    public SyAlarmDto.Item getById(String id) {
        SyAlarmDto.Item dto = syAlarmMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public SyAlarm findById(String id) {
        return syAlarmRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return syAlarmRepository.existsById(id);
    }

    public List<SyAlarmDto.Item> getList(SyAlarmDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return syAlarmMapper.selectList(req);
    }

    public SyAlarmDto.PageResponse getPageData(SyAlarmDto.Request req) {
        PageHelper.addPaging(req);
        SyAlarmDto.PageResponse res = new SyAlarmDto.PageResponse();
        List<SyAlarmDto.Item> list = syAlarmMapper.selectPageList(req);
        long count = syAlarmMapper.selectPageCount(req);
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public SyAlarm create(SyAlarm body) {
        body.setAlarmId(CmUtil.generateId("sy_alarm"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAlarmId());
    }

    @Transactional
    public SyAlarm save(SyAlarm entity) {
        if (!existsById(entity.getAlarmId()))
            throw new CmBizException("존재하지 않는 알람입니다: " + entity.getAlarmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(saved.getAlarmId());
    }

    @Transactional
    public SyAlarm update(String id, SyAlarm body) {
        SyAlarm entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "alarmId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        SyAlarm saved = syAlarmRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return findById(id);
    }

    @Transactional
    public SyAlarm updatePartial(SyAlarm entity) {
        if (entity.getAlarmId() == null) throw new CmBizException("alarmId 가 필요합니다.");
        if (!existsById(entity.getAlarmId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getAlarmId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = syAlarmMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return findById(entity.getAlarmId());
    }

    @Transactional
    public void delete(String id) {
        SyAlarm entity = findById(id);
        syAlarmRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    // ── _row_status 기반 저장 (기존 호환) ────────────────────────────

    @Transactional
    public SyAlarm saveByRowStatus(SyAlarmReq req) {
        return doSaveByRowStatus(req);
    }

    @Transactional
    public List<SyAlarm> saveListByRowStatus(List<SyAlarmReq> list) {
        List<SyAlarm> result = new ArrayList<>();
        for (SyAlarmReq req : list.stream().filter(r -> "D".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (SyAlarmReq req : list.stream().filter(r -> "U".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        for (SyAlarmReq req : list.stream().filter(r -> "I".equals(r.getRowStatus())).toList()) result.add(doSaveByRowStatus(req));
        return result;
    }

    private SyAlarm doSaveByRowStatus(SyAlarmReq req) {
        return switch (req.getRowStatus()) {
            case "I" -> create(req.toEntity());
            case "U" -> {
                if (!existsById(req.getAlarmId()))
                    throw new CmBizException("존재하지 않는 알람입니다: " + req.getAlarmId());
                yield save(req.toEntity());
            }
            case "D" -> {
                if (!existsById(req.getAlarmId()))
                    throw new CmBizException("존재하지 않는 알람입니다: " + req.getAlarmId());
                syAlarmRepository.deleteById(req.getAlarmId());
                yield null;
            }
            default -> throw new CmBizException("올바르지 않은 _row_status: " + req.getRowStatus());
        };
    }
}
