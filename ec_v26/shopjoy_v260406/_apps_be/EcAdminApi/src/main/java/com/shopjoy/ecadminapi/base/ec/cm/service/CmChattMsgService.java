package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattMsgDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattMsg;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattMsgRepository;
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
public class CmChattMsgService {

    private final CmChattMsgRepository cmChattMsgRepository;

    @PersistenceContext
    private EntityManager em;

    public CmChattMsgDto.Item getById(String id) {
        CmChattMsgDto.Item dto = cmChattMsgRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattMsgDto.Item getByIdOrNull(String id) {
        return cmChattMsgRepository.selectById(id).orElse(null);
    }

    public CmChattMsg findById(String id) {
        return cmChattMsgRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattMsg findByIdOrNull(String id) {
        return cmChattMsgRepository.findById(id).orElse(null);
    }

    public boolean existsById(String id) {
        return cmChattMsgRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmChattMsgRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    public List<CmChattMsgDto.Item> getList(CmChattMsgDto.Request req) {
        return cmChattMsgRepository.selectList(req);
    }

    public CmChattMsgDto.PageResponse getPageData(CmChattMsgDto.Request req) {
        PageHelper.addPaging(req);
        return cmChattMsgRepository.selectPageList(req);
    }

    @Transactional
    public CmChattMsg create(CmChattMsg body) {
        body.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattMsg save(CmChattMsg entity) {
        if (!existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 CmChattMsg입니다: " + entity.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattMsg update(String id, CmChattMsg body) {
        CmChattMsg entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattMsgId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattMsg saved = cmChattMsgRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    @Transactional
    public CmChattMsg updateSelective(CmChattMsg entity) {
        if (entity.getChattMsgId() == null) throw new CmBizException("chattMsgId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getChattMsgId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattMsgId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmChattMsgRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        CmChattMsg entity = findById(id);
        cmChattMsgRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    @Transactional
    public void saveList(List<CmChattMsg> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getChattMsgId() != null)
            .map(CmChattMsg::getChattMsgId)
            .toList();
        if (!deleteIds.isEmpty()) {
            cmChattMsgRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<CmChattMsg> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getChattMsgId() != null)
            .toList();
        for (CmChattMsg row : updateRows) {
            CmChattMsg entity = findById(row.getChattMsgId());
            VoUtil.voCopyExclude(row, entity, "chattMsgId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            cmChattMsgRepository.save(entity);
        }
        em.flush();

        List<CmChattMsg> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (CmChattMsg row : insertRows) {
            row.setChattMsgId(CmUtil.generateId("cm_chatt_msg"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            cmChattMsgRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
