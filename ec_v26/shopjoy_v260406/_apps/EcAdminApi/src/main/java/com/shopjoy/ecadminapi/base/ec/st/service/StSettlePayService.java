package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettlePayDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettlePayMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettlePayRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import com.shopjoy.ecadminapi.common.util.VoUtil;

@Service
@RequiredArgsConstructor
public class StSettlePayService {


    private final StSettlePayMapper stSettlePayMapper;
    private final StSettlePayRepository stSettlePayRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StSettlePayDto getById(String id) {
        StSettlePayDto result = stSettlePayMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StSettlePayDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettlePayDto> result = stSettlePayMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StSettlePayDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettlePayMapper.selectPageList(p), stSettlePayMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StSettlePay entity) {
        int result = stSettlePayMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettlePay create(StSettlePay entity) {
        entity.setSettlePayId(CmUtil.generateId("st_settle_pay"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay result = stSettlePayRepository.save(entity);
        return result;
    }

    @Transactional
    public StSettlePay save(StSettlePay entity) {
        if (!stSettlePayRepository.existsById(entity.getSettlePayId()))
            throw new CmBizException("존재하지 않는 StSettlePay입니다: " + entity.getSettlePayId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettlePay result = stSettlePayRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StSettlePay entity = stSettlePayRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettlePayRepository.delete(entity);
        em.flush();
        if (stSettlePayRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StSettlePay> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StSettlePay row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSettlePayId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_settle_pay"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stSettlePayRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettlePayId(), "settlePayId must not be null");
                StSettlePay entity = stSettlePayRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "settlePayId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stSettlePayRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettlePayId(), "settlePayId must not be null");
                if (stSettlePayRepository.existsById(id)) stSettlePayRepository.deleteById(id);
            }
        }
        em.flush();
    }
}