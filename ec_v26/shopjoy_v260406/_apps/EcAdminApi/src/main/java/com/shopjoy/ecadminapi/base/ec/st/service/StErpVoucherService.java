package com.shopjoy.ecadminapi.base.ec.st.service;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StErpVoucherDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucher;
import com.shopjoy.ecadminapi.base.ec.st.mapper.StErpVoucherMapper;
import com.shopjoy.ecadminapi.base.ec.st.repository.StErpVoucherRepository;
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
public class StErpVoucherService {


    private final StErpVoucherMapper stErpVoucherMapper;
    private final StErpVoucherRepository stErpVoucherRepository;

    @PersistenceContext
    private EntityManager em;

    // ── MyBatis 조회 ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public StErpVoucherDto getById(String id) {
        StErpVoucherDto result = stErpVoucherMapper.selectById(id);
        return result;
    }

    @Transactional(readOnly = true)
    public List<StErpVoucherDto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        List<StErpVoucherDto> result = stErpVoucherMapper.selectList(p);
        return result;
    }

    @Transactional(readOnly = true)
    public PageResult<StErpVoucherDto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        return PageResult.of(stErpVoucherMapper.selectPageList(p), stErpVoucherMapper.selectPageCount(p), PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    @Transactional
    public int update(StErpVoucher entity) {
        int result = stErpVoucherMapper.updateSelective(entity);
        return result;
    }

    // ── JPA 저장/삭제 ────────────────────────────────────────────

    @Transactional
    public StErpVoucher create(StErpVoucher entity) {
        entity.setErpVoucherId(CmUtil.generateId("st_erp_voucher"));
        entity.setRegBy(SecurityUtil.getAuthUser().authId());
        entity.setRegDate(LocalDateTime.now());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucher result = stErpVoucherRepository.save(entity);
        return result;
    }

    @Transactional
    public StErpVoucher save(StErpVoucher entity) {
        if (!stErpVoucherRepository.existsById(entity.getErpVoucherId()))
            throw new CmBizException("존재하지 않는 StErpVoucher입니다: " + entity.getErpVoucherId());
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        StErpVoucher result = stErpVoucherRepository.save(entity);
        return result;
    }

    @Transactional
    public void delete(String id) {
        StErpVoucher entity = stErpVoucherRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id));
        stErpVoucherRepository.delete(entity);
        em.flush();
        if (stErpVoucherRepository.existsById(id))
            throw new CmBizException("데이터 삭제에 실패했습니다.");
    }

    @Transactional
    public void saveList(List<StErpVoucher> rows) {
        String authId = SecurityUtil.getAuthUser().authId();
        LocalDateTime now = LocalDateTime.now();
        for (StErpVoucher row : rows) {
            String rs = row.getRowStatus();
            if ("I".equals(rs)) {
                row.setErpVoucherId(com.shopjoy.ecadminapi.common.util.CmUtil.generateId("st_erp_voucher"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                stErpVoucherRepository.save(row);
            } else if ("U".equals(rs)) {
                String id = Objects.requireNonNull(row.getErpVoucherId(), "erpVoucherId must not be null");
                StErpVoucher entity = stErpVoucherRepository.findById(id).orElseThrow(() -> new com.shopjoy.ecadminapi.common.exception.CmBizException("존재하지 않는 데이터입니다: " + id));
                VoUtil.voCopyExclude(row, entity, "erpVoucherId^regBy^regDate^rowStatus");
                entity.setUpdBy(authId); entity.setUpdDate(now);
                stErpVoucherRepository.save(entity);
            } else if ("D".equals(rs)) {
                String id = Objects.requireNonNull(row.getErpVoucherId(), "erpVoucherId must not be null");
                if (stErpVoucherRepository.existsById(id)) stErpVoucherRepository.deleteById(id);
            }
        }
        em.flush();
    }
}