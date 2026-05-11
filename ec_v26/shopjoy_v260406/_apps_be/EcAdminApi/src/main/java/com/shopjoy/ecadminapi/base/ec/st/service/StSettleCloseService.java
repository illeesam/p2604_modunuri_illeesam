package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleCloseDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleCloseMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleCloseRepository;
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
public class StSettleCloseService {

    private final StSettleCloseMapper stSettleCloseMapper;
    private final StSettleCloseRepository stSettleCloseRepository;

    @PersistenceContext
    private EntityManager em;

    public StSettleCloseDto.Item getById(String id) {
        StSettleCloseDto.Item dto = stSettleCloseMapper.selectById(id);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id);
        return dto;
    }

    public StSettleClose findById(String id) {
        return stSettleCloseRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
    }

    public boolean existsById(String id) {
        return stSettleCloseRepository.existsById(id);
    }

    public List<StSettleCloseDto.Item> getList(StSettleCloseDto.Request req) {
        if (req != null && req.getPageSize() != null) PageHelper.addPaging(req);
        return stSettleCloseMapper.selectList(VoUtil.voToMap(req));
    }

    public StSettleCloseDto.PageResponse getPageData(StSettleCloseDto.Request req) {
        PageHelper.addPaging(req);
        StSettleCloseDto.PageResponse res = new StSettleCloseDto.PageResponse();
        List<StSettleCloseDto.Item> list = stSettleCloseMapper.selectPageList(VoUtil.voToMap(req));
        long count = stSettleCloseMapper.selectPageCount(VoUtil.voToMap(req));
        return res.setPageInfo(list, count, PageHelper.getPageNo(), PageHelper.getPageSize(), req);
    }

    @Transactional
    public StSettleClose create(StSettleClose body) {
        body.setSettleCloseId(CmUtil.generateId("st_settle_close"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleClose save(StSettleClose entity) {
        if (!existsById(entity.getSettleCloseId()))
            throw new CmBizException("존재하지 않는 StSettleClose입니다: " + entity.getSettleCloseId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleClose update(String id, StSettleClose body) {
        StSettleClose entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "settleCloseId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleClose saved = stSettleCloseRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.flush();
        return saved;
    }

    @Transactional
    public StSettleClose updateSelective(StSettleClose entity) {
        if (entity.getSettleCloseId() == null) throw new CmBizException("settleCloseId 가 필요합니다.");
        if (!existsById(entity.getSettleCloseId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getSettleCloseId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = stSettleCloseMapper.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다.");
        em.clear();
        return entity;
    }

    @Transactional
    public void delete(String id) {
        StSettleClose entity = findById(id);
        stSettleCloseRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettleClose> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();

        List<String> deleteIds = rows.stream()
            .filter(r -> "D".equals(r.getRowStatus()) && r.getSettleCloseId() != null)
            .map(StSettleClose::getSettleCloseId)
            .toList();
        if (!deleteIds.isEmpty()) {
            stSettleCloseRepository.deleteAllById(deleteIds);
            em.flush();
            em.clear();
        }
        List<StSettleClose> updateRows = rows.stream()
            .filter(r -> "U".equals(r.getRowStatus()) && r.getSettleCloseId() != null)
            .toList();
        for (StSettleClose row : updateRows) {
            StSettleClose entity = findById(row.getSettleCloseId());
            VoUtil.voCopyExclude(row, entity, "settleCloseId^regBy^regDate^rowStatus");
            entity.setUpdBy(authId); entity.setUpdDate(now);
            stSettleCloseRepository.save(entity);
        }
        em.flush();

        List<StSettleClose> insertRows = rows.stream()
            .filter(r -> "I".equals(r.getRowStatus()))
            .toList();
        for (StSettleClose row : insertRows) {
            row.setSettleCloseId(CmUtil.generateId("st_settle_close"));
            row.setRegBy(authId); row.setRegDate(now);
            row.setUpdBy(authId); row.setUpdDate(now);
            stSettleCloseRepository.save(row);
        }
        em.flush();
        em.clear();
    }
}
