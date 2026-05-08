package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StSettleEtcAdjMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StSettleEtcAdjRepository;
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
@Transactional(readOnly = true)
public class StSettleEtcAdjService {


    private final StSettleEtcAdjMapper stSettleEtcAdjMapper;
    private final StSettleEtcAdjRepository stSettleEtcAdjRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    public StSettleEtcAdjDto getById(String id) {
        StSettleEtcAdjDto result = stSettleEtcAdjMapper.selectById(id);
        return result;
    }

    /** getList — 조회 */
    public List<StSettleEtcAdjDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StSettleEtcAdjDto> result = stSettleEtcAdjMapper.selectList(p);
        return result;
    }

    /** getPageData — 조회 */
    public PageResult<StSettleEtcAdjDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stSettleEtcAdjMapper.selectPageList(p), stSettleEtcAdjMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(StSettleEtcAdj entity) {
        int result = stSettleEtcAdjMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StSettleEtcAdj create(StSettleEtcAdj entity) {
        entity.setSettleEtcAdjId(CmUtil.generateId("st_settle_etc_adj"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj result = stSettleEtcAdjRepository.save(entity);
        return result;
    }

    /** save — 저장 */
    @Transactional
    public StSettleEtcAdj save(StSettleEtcAdj entity) {
        if (!stSettleEtcAdjRepository.existsById(entity.getSettleEtcAdjId()))
            throw new CmBizException("존재하지 않는 StSettleEtcAdj입니다: " + entity.getSettleEtcAdjId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StSettleEtcAdj result = stSettleEtcAdjRepository.save(entity);
        return result;
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        StSettleEtcAdj entity = stSettleEtcAdjRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stSettleEtcAdjRepository.delete(entity);
        em.flush();
        if (stSettleEtcAdjRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    /** saveList — 저장 */
    @Transactional
    public void saveList(List<StSettleEtcAdj> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StSettleEtcAdj row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setSettleEtcAdjId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_settle_etc_adj"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stSettleEtcAdjRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleEtcAdjId(), "settleEtcAdjId must not be null");
                StSettleEtcAdj entity = stSettleEtcAdjRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "settleEtcAdjId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stSettleEtcAdjRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getSettleEtcAdjId(), "settleEtcAdjId must not be null");
                if (stSettleEtcAdjRepository.existsById(id)) stSettleEtcAdjRepository.deleteById(id);
            }
        }
        em.flush();
    }
}